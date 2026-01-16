package devbox

import (
	"context"
	"time"

	corev1 "k8s.io/api/core/v1"

	"github.com/gitlayzer/devbox-sdk-go/api/v1alpha2"
	"github.com/gitlayzer/devbox-sdk-go/types"
)

// Devbox represents a single Devbox instance.
type Devbox struct {
	crd *v1alpha2.Devbox
	sdk *DevboxSDK
}

// newDevbox creates a new Devbox instance.
func newDevbox(crd *v1alpha2.Devbox, sdk *DevboxSDK) *Devbox {
	return &Devbox{
		crd: crd,
		sdk: sdk,
	}
}

// Name returns the name of the devbox.
func (d *Devbox) Name() string {
	return d.crd.Name
}

// UID returns the unique ID of the devbox.
func (d *Devbox) UID() string {
	return string(d.crd.UID)
}

// Status returns the current status/phase of the devbox.
func (d *Devbox) Status() string {
	return string(d.crd.Status.Phase)
}

// State returns the desired state of the devbox.
func (d *Devbox) State() string {
	return string(d.crd.Spec.State)
}

// Image returns the runtime image.
func (d *Devbox) Image() string {
	return d.crd.Spec.Image
}

// CreatedAt returns the creation timestamp.
func (d *Devbox) CreatedAt() time.Time {
	return d.crd.CreationTimestamp.Time
}

// CPULimit returns the CPU limit in cores.
func (d *Devbox) CPULimit() float64 {
	if cpu, ok := d.crd.Spec.Resource[corev1.ResourceCPU]; ok {
		return float64(cpu.MilliValue()) / 1000
	}
	return 0
}

// MemoryLimit returns the memory limit in GB.
func (d *Devbox) MemoryLimit() float64 {
	if mem, ok := d.crd.Spec.Resource[corev1.ResourceMemory]; ok {
		return float64(mem.Value()) / (1024 * 1024 * 1024)
	}
	return 0
}

// NetworkType returns the network type (NodePort/Tailnet/SSHGate).
func (d *Devbox) NetworkType() string {
	return string(d.crd.Status.Network.Type)
}

// NodePort returns the SSH NodePort.
func (d *Devbox) NodePort() int32 {
	return d.crd.Status.Network.NodePort
}

// NetworkUniqueID returns the unique network ID (for SSHGate).
func (d *Devbox) NetworkUniqueID() string {
	return d.crd.Status.Network.UniqueID
}

// Node returns the node name where the devbox is running.
func (d *Devbox) Node() string {
	return d.crd.Status.Node
}

// WorkingDir returns the working directory.
func (d *Devbox) WorkingDir() string {
	return d.crd.Spec.Config.WorkingDir
}

// User returns the user name.
func (d *Devbox) User() string {
	return d.crd.Spec.Config.User
}

// Ports returns the configured ports.
func (d *Devbox) Ports() []corev1.ContainerPort {
	return d.crd.Spec.Config.Ports
}

// AppPorts returns the configured app ports.
func (d *Devbox) AppPorts() []corev1.ServicePort {
	return d.crd.Spec.Config.AppPorts
}

// CRD returns the underlying CRD object.
func (d *Devbox) CRD() *v1alpha2.Devbox {
	return d.crd
}

// RefreshInfo refreshes the devbox info from Kubernetes.
func (d *Devbox) RefreshInfo(ctx context.Context) error {
	devbox, err := d.sdk.client.Get(ctx, d.crd.Name)
	if err != nil {
		return err
	}
	d.crd = devbox
	d.sdk.cache.Set(d.crd.Name, devbox)
	return nil
}

// WaitForReady waits for the devbox to become ready.
func (d *Devbox) WaitForReady(ctx context.Context, opts types.WaitForReadyOptions) error {
	// Set defaults
	timeout := opts.Timeout
	if timeout == 0 {
		timeout = 300 * time.Second
	}

	initialInterval := opts.InitialCheckInterval
	if initialInterval == 0 {
		initialInterval = 200 * time.Millisecond
	}

	maxInterval := opts.MaxCheckInterval
	if maxInterval == 0 {
		maxInterval = 5 * time.Second
	}

	backoffMultiplier := opts.BackoffMultiplier
	if backoffMultiplier == 0 {
		backoffMultiplier = 1.5
	}

	useExponentialBackoff := true
	if opts.UseExponentialBackoff != nil {
		useExponentialBackoff = *opts.UseExponentialBackoff
	}
	if opts.CheckInterval > 0 {
		useExponentialBackoff = false
	}

	deadline := time.Now().Add(timeout)
	interval := initialInterval
	if !useExponentialBackoff && opts.CheckInterval > 0 {
		interval = opts.CheckInterval
	}

	for {
		if time.Now().After(deadline) {
			return &TimeoutError{message: "waiting for devbox to be ready", timeout: timeout}
		}

		// Refresh info
		if err := d.RefreshInfo(ctx); err != nil {
			return err
		}

		// Check if ready
		if d.isReady() {
			return nil
		}

		// Wait before next check
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(interval):
		}

		// Apply exponential backoff
		if useExponentialBackoff {
			interval = time.Duration(float64(interval) * backoffMultiplier)
			if interval > maxInterval {
				interval = maxInterval
			}
		}
	}
}

// isReady checks if the devbox is ready for operations.
func (d *Devbox) isReady() bool {
	return d.crd.Status.Phase == v1alpha2.DevboxPhaseRunning
}

// Start starts the devbox.
func (d *Devbox) Start(ctx context.Context) error {
	return d.sdk.client.UpdateState(ctx, d.crd.Name, v1alpha2.DevboxStateRunning)
}

// Pause pauses the devbox.
func (d *Devbox) Pause(ctx context.Context) error {
	return d.sdk.client.UpdateState(ctx, d.crd.Name, v1alpha2.DevboxStatePaused)
}

// Stop stops the devbox.
func (d *Devbox) Stop(ctx context.Context) error {
	return d.sdk.client.UpdateState(ctx, d.crd.Name, v1alpha2.DevboxStateStopped)
}

// Shutdown shuts down the devbox (releases all resources).
func (d *Devbox) Shutdown(ctx context.Context) error {
	return d.sdk.client.UpdateState(ctx, d.crd.Name, v1alpha2.DevboxStateShutdown)
}

// Delete deletes the devbox.
func (d *Devbox) Delete(ctx context.Context) error {
	if err := d.sdk.client.Delete(ctx, d.crd.Name); err != nil {
		return err
	}
	d.sdk.cache.Delete(d.crd.Name)
	return nil
}

// TimeoutError represents a timeout error.
type TimeoutError struct {
	message string
	timeout time.Duration
}

func (e *TimeoutError) Error() string {
	return e.message + " (timeout: " + e.timeout.String() + ")"
}

// SSHKeyPair contains SSH key pair data.
type SSHKeyPair struct {
	PublicKey  string
	PrivateKey string
}

// GetSSHKeyPair retrieves the SSH key pair for this devbox.
func (d *Devbox) GetSSHKeyPair(ctx context.Context) (*SSHKeyPair, error) {
	keyPair, err := d.sdk.client.GetSSHKeyPair(ctx, d.crd.Name)
	if err != nil {
		return nil, err
	}
	return &SSHKeyPair{
		PublicKey:  keyPair.PublicKey,
		PrivateKey: keyPair.PrivateKey,
	}, nil
}

// SSHConnectionString returns the SSH connection string.
func (d *Devbox) SSHConnectionString() string {
	switch d.crd.Status.Network.Type {
	case v1alpha2.NetworkTypeSSHGate:
		return d.crd.Status.Network.UniqueID + "@bja.sealos.run"
	case v1alpha2.NetworkTypeNodePort:
		return d.crd.Spec.Config.User + "@<node-ip>:" + string(rune(d.crd.Status.Network.NodePort))
	default:
		return ""
	}
}

// Release represents a devbox release.
type Release struct {
	crd *v1alpha2.DevBoxRelease
	sdk *DevboxSDK
}

// Name returns the release name.
func (r *Release) Name() string {
	return r.crd.Name
}

// Version returns the release version.
func (r *Release) Version() string {
	return r.crd.Spec.Version
}

// Phase returns the release phase.
func (r *Release) Phase() string {
	return string(r.crd.Status.Phase)
}

// Notes returns the release notes.
func (r *Release) Notes() string {
	return r.crd.Spec.Notes
}

// SourceImage returns the source image.
func (r *Release) SourceImage() string {
	return r.crd.Status.SourceImage
}

// TargetImage returns the target image.
func (r *Release) TargetImage() string {
	return r.crd.Status.TargetImage
}

// CRD returns the underlying CRD object.
func (r *Release) CRD() *v1alpha2.DevBoxRelease {
	return r.crd
}

// ReleaseConfig contains configuration for creating a release.
type ReleaseConfig struct {
	Version                 string
	Notes                   string
	StartDevboxAfterRelease bool
}

// CreateRelease creates a new release for this devbox.
func (d *Devbox) CreateRelease(ctx context.Context, cfg ReleaseConfig) (*Release, error) {
	release := &v1alpha2.DevBoxRelease{}
	release.Name = d.crd.Name + "-" + cfg.Version
	release.Spec = v1alpha2.DevBoxReleaseSpec{
		DevboxName:              d.crd.Name,
		Version:                 cfg.Version,
		Notes:                   cfg.Notes,
		StartDevboxAfterRelease: cfg.StartDevboxAfterRelease,
	}

	created, err := d.sdk.client.CreateRelease(ctx, release)
	if err != nil {
		return nil, err
	}

	return &Release{crd: created, sdk: d.sdk}, nil
}

// ListReleases lists all releases for this devbox.
func (d *Devbox) ListReleases(ctx context.Context) ([]*Release, error) {
	list, err := d.sdk.client.ListReleases(ctx, d.crd.Name)
	if err != nil {
		return nil, err
	}

	releases := make([]*Release, len(list.Items))
	for i := range list.Items {
		releases[i] = &Release{crd: &list.Items[i], sdk: d.sdk}
	}

	return releases, nil
}
