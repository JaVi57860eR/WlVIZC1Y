//Calculate button
const mainButton = document.createElement("div");
mainButton.id = "myExtensionRoot";
mainButton.innerHTML = '<div class = "flex justify-center items-center"><button id="calculateBtn" class="flex justify-center !mx-auto !cursor-pointer !bg-purple-600 !text-white !text-3xl !font-sans !p-5 !px-6 !font-medium !rounded-xl shadow drop-shadow-md hover:!bg-purple-700 !transition !duration-200">Analyze Your CGPA</div></button>'
const getTopMenu = document.getElementsByClassName("top-nav");
getTopMenu[0].appendChild(mainButton);

//Adding graph cdn
const script = document.createElement("script");
script.src = chrome.runtime.getURL("chart.umd.js");
document.head.appendChild(script);



//change table length
const getTableLength = document.getElementsByName("dynamic-table_length");
const getTableLengthOptions = getTableLength[0].querySelectorAll("option");
getTableLengthOptions[0].removeAttribute("selected");
getTableLengthOptions[3].setAttribute("selected", "selected");
getTableLengthOptions[3].dispatchEvent(new Event("change", { bubbles: true }));


//Getting table data
let primaryAllData = [];
const getTable = document.getElementsByTagName("tbody")[0];
const getTr = getTable.querySelectorAll("tr");

getTr.forEach((tr) => {
    const td = tr.querySelectorAll("td");
    const {level, term} = parseLevelTerm(td[2].innerText.trim());
    const gradePoint = letterToGradePoint(td[4].innerText.trim());

    primaryAllData.push({
        courseCode : td[0].innerText.trim(),
        courseCredit : Number(td[1].innerText.trim()),
        sessional : td[3].innerText.trim(),
        level: level,
        term: term,
        letterGrade : td[4].innerText.trim(),
        gradePoint: gradePoint,
        courseType : td[5].innerText.trim()

    })

});


//Dummy Data Checking (if needed)
//primaryAllData = dummyData();
//console.log(primaryAllData);

//Filtering table data
const allData = getHighestGradeCourses(primaryAllData);


//Main function
async function mainCalculation() {
    try {
        await insertExternalHtml();

        //toggle the calculation section using the button
        const extBox = document.getElementById("extBox");
        calculateBtn.addEventListener('click', () => {
            extBox.classList.toggle("hidden");
        });

        //Assigning the action of close button
        const closeBtn = document.getElementById("closeBtn");
        closeBtn.addEventListener("click", ()=> {
            extBox.classList.add("hidden");
        })

        

        if(!allData || allData.length === 0) {
            const errorWrapper = document.getElementById("errorWrapper");
            const analysisWrapper = document.getElementById("analysisWrapper");
            const errorMessage = document.getElementById("errorMessage");

            analysisWrapper.classList.add("hidden");
            errorWrapper.classList.remove("hidden");
            errorMessage.innerText = "No Data Availabe!";

            return;
        }

        //Showing overall CGPA
        const overallCgpa = document.getElementById("overallCgpa");
        overallCgpa.textContent = calculateCGPA(allData);

       
        //Termwise Result
        showTermWiseResult(allData);


        //Show Course Summary
        showCourseSummary(allData);


        //Show subjects per grade
        showSubjectPerGrade(allData);


        //Graph cgpa vs Level Term
        cgpaVsLT(allData);


        //Show target Cgpa
        showTargetCgpa(allData);

        //What if calculator
        firstFieldToWhatifContainer(allData);
        addFieldToWhatifContainer(allData);

        const whatifCalcBtn = document.getElementById("whatifCalcBtn");
        whatifCalcBtn.addEventListener("click", () => {whatifShowResult(allData)});

        
        //last term result
        lastTermResult(allData);

        //developer page
        developerPage();


    } catch (error) {
        console.log(error);
    }
}

mainCalculation ();
