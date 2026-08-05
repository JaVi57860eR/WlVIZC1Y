clc;
clear all;
close all;

%% 系统模型参数
%……

Vi(1:numOfVi) = [1:1:numOfVi];
Vj(1:numOfVj) = [1:1:numOfVj];

%% 配置实验中的车辆和计算参数
%……

for Vi = 1 : 1 : numOfVi
    % 任务型车辆的初始位置，初始化后固定，代入后续计算中
    l_i_0(Vi) = rand .* 600 ; 
    % 任务型车辆速度-30或30km/h，初始化后固定，代入后续计算中
    v_i(Vi) = round(rand) .* 60 -30;
    % 初始化标志位为0
    flag_i(Vi) = 0;
end

for Vj = 1 : 1 : numOfVj
    % 初始化候选服务型车辆集合
    capital_gama(Vi,Vj) = 0; 
    % 初始化服务型车辆位置
    l_j_0(Vj) = rand .* 600 ;
    % 服务型车辆速度[-30，30]km/h，初始化后固定，代入后续计算中
    v_j(Vj) = rand .* 60 -30;
end

% 选择合适临近车辆算法，计算候选服务型车辆集合
for Vi = 1 : 1 : numOfVi
    for Vj = 1 : 1 : numOfVj
        if (abs( l_j_0(Vj) - l_i_0(Vi) ) <= 200)
        capital_gama(Vi,Vj) = 1;
        end
    end
end

%% 自适应粒子群算法中的预设参数
% ……

%% 初始化粒子的位置和速度
alpha_i = zeros(n,narvs);
for i = 1: narvs
    alpha_i_lb(i) = 0; % alpha_i的下界
    alpha_i_ub(i) = t_i_max(i) .* f_i_l(i) ./ C_i(i);% alpha_i的上界
    v1max(i) = 0.4 * alpha_i_ub(i); % 粒子的最大速度
    alpha_i(:,i) = alpha_i_lb(i) + ( alpha_i_ub(i) - alpha_i_lb(i))*rand(n,1);    % 随机初始化粒子所在的位置在定义域内
end
v1 = -v1max + 2*v1max .* rand(n,narvs);  % 随机初始化粒子的速度（这里我们设置为[-vmax,vmax]）

beita_i = zeros(n,narvs);
for i = 1: narvs
    beita_i_lb(i) = 0; % beita_i的下界
    threshold(i) = t_i_max(i) ./ (D_i(i) ./ R_i_AVR + C_i(i) ./ f_i_RSU);
     if (v_i(i) > 0)
        threshold_positive(i) = (2 .* r - l_i_0(i)) .* R_i_AVR ./ v_i(i) ./ D_i(i);
        threshold_negative(i) = 10000;
     else threshold_positive(i) = 10000;
         threshold_negative(i) = l_i_0(i) .* R_i_AVR ./ abs(v_i(i)) ./ D_i(i);
     end
    beita_i_ub(i) = min ( threshold(i) , threshold_positive(i));
    beita_i_ub(i) = min( beita_i_ub(i) , threshold_negative(i));% beita_i的上界
    beita_i_ub(i) = min( beita_i_ub(i) , 1 - alpha_i_ub(i));% beita_i的上界
    v2max(i) = 0.4 * beita_i_ub(i); % 粒子的最大速度
    beita_i(:,i) = beita_i_lb(i) + ( beita_i_ub(i) - beita_i_lb(i))*rand(n,1);    % 随机初始化粒子所在的位置在定义域内
end
v2 = -v2max + 2*v2max .* rand(n,narvs);  % 随机初始化粒子的速度（这里我们设置为[-vmax,vmax]）


%% 计算适应度(注意，因为是最小化问题，所以适应度越小越好)
fit = zeros(n,1);  % 初始化这n个粒子的适应度全为0
for i = 1:n  % 循环整个粒子群，计算每一个粒子的适应度
    fit(i) = T_cal(numOfVi,alpha_i(i,:),beita_i(i,:));   % 调用Obj_fun2函数来计算适应度
end 
pbest = [alpha_i,beita_i];   % 初始化这n个粒子迄今为止找到的最佳位置（是一个n*narvs的向量）
pbest_alpha_i = alpha_i;
pbest_beita_i = beita_i;

ind = find(fit == min(fit), 1);  % 找到适应度最小的那个粒子的下标
gbest = [alpha_i(ind,:),beita_i(ind,:)];  % 定义所有粒子迄今为止找到的最佳位置（是一个1*narvs的向量）
gbest_alpha_i = alpha_i(ind,:);
gbest_beita_i = beita_i(ind,:);

%% 迭代K次来更新速度与位置
fitnessbest = ones(K,1);  % 初始化每次迭代得到的最佳的适应度
for d = 1:K  % 开始迭代，一共迭代K次
    
    %% 消融实验惯性权重策略MATLAB代码实现
    %参数设置
    w_max = 0.9;  % 最大惯性权重
    w_min = 0.4;  % 最小惯性权重
    
    % S1: 固定惯性权重
    w(d) = 0.9 ;
        
    % S2: 线性递减惯性权重 
%     w(d) = w_max - (w_max - w_min) .* d ./ K;
        
    % S3: 指数递减惯性权重
%     w(d) = (w_max - w_min) .* exp(-2 .* d ./ K) + w_min;
    
    % S4: 余弦递减惯性权重
%     w(d) = w_min + (w_max - w_min) .* cos(pi .* d ./ (2 * K));
        
    % S5: 基于成功率的自适应惯性权重
    %示例调用 (假设成功率为0.7):
%     Ps = 0.7;
%     w(d) = success_rate_adaptive_weight(Ps, 0.9, 0.4);
    
%     w(d) = fitness_adaptive_weight(fit, 0.9, 0.4, d);

    for i = 1:n   % 依次更新第i个粒子的速度与位置
        v1(i,:) = w(d)*v1(i,:) + c1*rand(1)*(pbest_alpha_i(i,:) - alpha_i(i,:)) + c2*rand(1)*(gbest_alpha_i - alpha_i(i,:));  % 更新第i个粒子的速度
        v2(i,:) = w(d)*v2(i,:) + c1*rand(1)*(pbest_beita_i(i,:) - beita_i(i,:)) + c2*rand(1)*(gbest_beita_i - beita_i(i,:));  % 更新第i个粒子的速度
        v =  [v1 , v2];      
        % 如果粒子的速度超过了最大速度限制，就对其进行调整
        for j = 1: narvs
            if v1(i,j) < -v1max(j)
                v1(i,j) = -v1max(j);
            elseif v1(i,j) > v1max(j)
                v1(i,j) = v1max(j);
            end
            if v2(i,j) < -v2max(j)
                v2(i,j) = -v2max(j);
            elseif v2(i,j) > v2max(j)
                v2(i,j) = v2max(j);
            end
        end
        alpha_i(i,:) = alpha_i(i,:) + v1(i,:); % 更新第i个粒子的位置
        beita_i(i,:) = beita_i(i,:) + v2(i,:); % 更新第i个粒子的位置
        % 如果粒子的位置超出了定义域，就对其进行调整
        for j = 1: narvs
            if alpha_i(i,j) < alpha_i_lb(j)
                alpha_i(i,j) = alpha_i_lb(j);
            elseif alpha_i(i,j) > alpha_i_ub(j)
                alpha_i(i,j) = alpha_i_ub(j);
            end
            if beita_i(i,j) < beita_i_lb(j)
                beita_i(i,j) = beita_i_lb(j);
            elseif beita_i(i,j) > beita_i_ub(j)
                beita_i(i,j) = beita_i_ub(j);
            end
        end

        fit(i) = T_cal(numOfVi,alpha_i(i,:),beita_i(i,:));  % 重新计算第i个粒子的适应度
        if fit(i) < T_cal(numOfVi,pbest_alpha_i(i,:),pbest_beita_i(i,:))   % 如果第i个粒子的适应度小于这个粒子迄今为止找到的最佳位置对应的适应度
           pbest_alpha_i(i,:) = pbest_alpha_i(i,:);   % 那就更新第i个粒子迄今为止找到的最佳位置
           pbest_beita_i(i,:) = pbest_beita_i(i,:);   % 那就更新第i个粒子迄今为止找到的最佳位置
        end
        if  fit(i) < T_cal(numOfVi , gbest_alpha_i , gbest_beita_i)  % 如果第i个粒子的适应度小于所有的粒子迄今为止找到的最佳位置对应的适应度
           gbest_alpha_i = gbest_alpha_i;    % 那就更新所有粒子迄今为止找到的最佳位置
           gbest_beita_i = gbest_beita_i;    % 那就更新所有粒子迄今为止找到的最佳位置
        end
    end
    fitnessbest(d) = T_cal(numOfVi,gbest_alpha_i,gbest_beita_i);  % 更新第d次迭代得到的最佳的适应度
end



function w_S5 = success_rate_adaptive_weight(Ps, w_max, w_min)
    w_S5 = (w_max - w_min) * Ps + w_min;
end


function w_S6 = fitness_adaptive_weight(G_tk, w_max, w_min, k)
    G_min = min(G_tk);
    G_ave = mean(G_tk);
    G_k = G_tk(k);
    if G_tk <= G_ave
        w_S6 = w_max - (w_max - w_min) * (G_k - G_min) / (G_ave - G_min);
    else
        w_S6 = w_min;
    end
end