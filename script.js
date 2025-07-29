const urlParams = new URLSearchParams(window.location.search);
let row = urlParams.get('r');
let plusOne = urlParams.has('p');
const webAppUrl = 'https://script.google.com/macros/s/AKfycbwd-neMhBu9Jbu7iVPHrAxsg07i-iB3vF89Ol70KIPA5OqdQNz3mtl4ETtjzkO3DkCzlg/exec';

let cachedData = null;
let cachedPlusOneData = null;

if (row) {
    cachedData = JSON.parse(localStorage.getItem('guestData_' + row));
    const plusOneRow = Number(row) + 1;
    cachedPlusOneData = JSON.parse(localStorage.getItem('guestData_' + plusOneRow));
} else {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('guestData_')) {
            cachedData = JSON.parse(localStorage.getItem(key));
            row = key.split('_')[1];
            const plusOneRow = Number(row) + 1;
            cachedPlusOneData = JSON.parse(localStorage.getItem('guestData_' + plusOneRow));
            plusOne = cachedPlusOneData != null;
            break;
        }
    }
}

function displayData(guestData, plusOneData) {
    const greetingElement = document.getElementById('greeting');
    greetingElement.textContent = plusOneData
        ? `Hello, ${guestData.name} & ${plusOneData.name}!`
        : `Hello, ${guestData.name}!`;

    document.getElementById('mainGuestName').textContent = guestData.name;
    if (document.querySelector(`input[name="mainResponse"][value="${guestData.rsvp}"]`) != null) {
        document.querySelector(`input[name="mainResponse"][value="${guestData.rsvp}"]`).checked = true;
    }
    document.getElementById('mainFood').value = guestData.food;
    document.getElementById('mainFoodDetails').value = guestData.foodDetails;

    if (plusOneData) {
        plusOne = true;
        document.getElementById('plusOneName').textContent = plusOneData.name;
        document.getElementById('plusOneSection').classList.remove('hidden');
        if (document.querySelector(`input[name="plusOneResponse"][value="${plusOneData.rsvp}"]`) != null) {
            document.querySelector(`input[name="plusOneResponse"][value="${plusOneData.rsvp}"]`).checked = true;
        }
        document.getElementById('plusOneFood').value = plusOneData.food;
        document.getElementById('plusOneFoodDetails').value = plusOneData.foodDetails;
    }

    document.getElementById('loadingMessage').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    document.getElementById('fallbackForm').classList.add('hidden');
}

function showRSVPSummary(guestData, plusOneData) {
    console.log(guestData);
    let summaryText = `${guestData.name} is ${guestData.rsvp == "Yes" ? "" : "not "}coming.`
    if (guestData.rsvp == "Yes") {
        summaryText += ` Dietary restrictions: ${guestData.food}`;
        if (guestData.foodDetails != "") {
            summaryText += ` (${guestData.foodDetails}).`;
        } else {
            summaryText += '.';
        }
    }
    if (plusOne) {
        summaryText += '<br/>';
        summaryText += `${plusOneData.name} is ${plusOneData.rsvp == "Yes" ? "" : "not "}coming.`
        if (plusOneData.rsvp == "Yes") {
            summaryText += ` Dietary restrictions: ${plusOneData.food}`;
            if (plusOneData.foodDetails != "") {
                summaryText += ` (${plusOneData.foodDetails}).`;
            } else {
                summaryText += '.';
            }
        }
    }
    document.getElementById("rsvpSummary").innerHTML = '<p>' + summaryText + '</p>';
    document.getElementById("rsvpSuccess").classList.remove("hidden");
}

function setupFoodDetailsToggle() {
    const mainFoodSelect = document.getElementById("mainFood");
    const mainFoodDetails = document.getElementById("foodDetailsContainer");
    mainFoodSelect.addEventListener("change", () => {
        mainFoodDetails.classList.toggle("hidden", !["Allergy", "Other"].includes(mainFoodSelect.value));
    });

    const plusOneFoodSelect = document.getElementById("plusOneFood");
    const plusOneFoodDetails = document.getElementById("plusOneFoodDetailsContainer");
    plusOneFoodSelect.addEventListener("change", () => {
        plusOneFoodDetails.classList.toggle("hidden", !["Allergy", "Other"].includes(plusOneFoodSelect.value));
    });
}

function fetchData(fromUrl) {
    fetch(fromUrl, {
        method: "GET",
        mode: "cors",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    })
        .then(response => response.json())
        .then(data => {
            if (row == null) {
                row = data[0][0];
                plusOne = data[0][2] == 'yes';
            }
            const guestData = { name: data[0][1], rsvp: data[0][3], food: data[0][4], foodDetails: data[0][5] };
            const plusOneData = plusOne && data[1] ? { name: data[1][1], rsvp: data[1][3], food: data[1][4], foodDetails: data[1][5] } : null;

            cachedData = guestData;
            cachedPlusOneData = plusOneData;

            displayData(guestData, plusOneData);

            localStorage.setItem('guestData_' + row, JSON.stringify(guestData));
            if (plusOneData) {
                localStorage.setItem('guestData_' + (parseInt(row) + 1), JSON.stringify(plusOneData));
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            document.getElementById('tryAgain').classList.remove("hidden");
            document.getElementById('fallbackForm').classList.remove("hidden");
            document.getElementById('loadingMessage').classList.add("hidden");
        });
}

function checkIfHasDataAndShowDataOrForm() {
    if (cachedData) {
        document.getElementById("loadingMessage").classList.add("hidden");

        if (cachedData.rsvp == "") {
            displayData(cachedData, cachedPlusOneData);
        } else {
            showRSVPSummary(cachedData, cachedPlusOneData);
        }
    } else {
        if (row) {
            console.log()
            fetchData(`${webAppUrl}?r=${row}&p=${plusOne}`);
        } else {
            document.getElementById('fallbackForm').classList.remove('hidden');
            document.getElementById("loadingMessage").classList.add("hidden");
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("loadingMessage").classList.remove("hidden");
    document.getElementById("mainContent").classList.add("hidden");

    checkIfHasDataAndShowDataOrForm();

    setupFoodDetailsToggle();

    document.getElementById("rsvpForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        document.body.style.cursor = "wait";

        const mainGuestRSVP = document.querySelector('input[name="mainResponse"]:checked').value;
        if (mainGuestRSVP == null) {
            alert('Please select your RSVP.');
        }
        let mainGuestFood = document.getElementById("mainFood").value;
        if (mainGuestFood == "") {
            mainGuestFood = "None";
        }
        const mainGuestFoodDetails = ["Allergy", "Other"].includes(mainGuestFood) ? document.getElementById("mainFoodDetails").value : "";

        const postData = new URLSearchParams({
            row: row,
            response: mainGuestRSVP,
            food: mainGuestFood,
            foodDetails: mainGuestFoodDetails
        });

        let plusOneRSVP = null;
        let plusOneFood = null;
        let plusOneFoodDetails = null;
        if (plusOne) {
            plusOneRSVP = document.querySelector('input[name="plusOneResponse"]:checked').value;
            if (plusOneRSVP == null) {
                alert('Please select your RSVP.');
            }
            plusOneFood = document.getElementById("plusOneFood").value;
            if (plusOneFood == "") {
                plusOneFood = "None";
            }
            plusOneFoodDetails = ["Allergy", "Other"].includes(plusOneFood) ? document.getElementById("plusOneFoodDetails").value : "";

            postData.append('plusOneRow', parseInt(row) + 1);
            postData.append('plusOneResponse', plusOneRSVP);
            postData.append('plusOneFood', plusOneFood);
            postData.append('plusOneFoodDetails', plusOneFoodDetails);
        }

        fetch(webAppUrl, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: postData
        })
            .then(response => response.text())
            .then(() => {
                document.body.style.cursor = "default";
                document.getElementById("mainContent").classList.add("hidden");
                cachedData.rsvp = mainGuestRSVP;
                cachedData.food = mainGuestFood;
                cachedData.foodDetails = mainGuestFoodDetails;
                localStorage.setItem('guestData_' + row, JSON.stringify(cachedData));
                if (plusOne) {
                    cachedPlusOneData.rsvp = plusOneRSVP;
                    cachedPlusOneData.food = plusOneFood;
                    cachedPlusOneData.foodDetails = plusOneFoodDetails;
                    localStorage.setItem('guestData_' + (Number(row) + 1), JSON.stringify(cachedPlusOneData));
                }
                document.body.style.cursor = "default";
                showRSVPSummary(cachedData, cachedPlusOneData);
            })
            .catch(error => {
                console.error('Error posting data:', error);
                document.body.style.cursor = "default";
                alert('Failed to submit RSVP.');
            });
    });

    document.getElementById("guestFindForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        document.getElementById('fallbackForm').classList.add('hidden');
        document.getElementById('tryAgain').classList.add("hidden");
        document.getElementById("loadingMessage").classList.remove("hidden");

        fetchData(`${webAppUrl}?name=${document.getElementById("guestName").value}`);
    });

    const toggleButton = document.querySelector('.menu-toggle');
    const menuList = document.querySelector('.menu ul');

    toggleButton.addEventListener('click', () => {
        menuList.classList.toggle('open');
    });

    document.querySelectorAll('.menu a').forEach(link => {
        link.addEventListener('click', () => {
            menuList.classList.remove('open');
        });
    });

    document.getElementById("changeRsvpButton").addEventListener("click", () => {
        document.getElementById("rsvpSuccess").classList.add("hidden");
        displayData(cachedData, cachedPlusOneData);
        document.getElementById("rsvpForm").classList.remove("hidden");
    });
});