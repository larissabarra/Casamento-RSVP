const urlParams = new URLSearchParams(window.location.search);
let row = urlParams.get('r');
let plusOne = urlParams.has('p');
const webAppUrl = 'https://script.google.com/macros/s/AKfycbxLQaem67y_pLRxr-OKupsJ9Sn54A2Od448XAWlzNqOGE9gP4vuvmDG3aH-GdwC-dhmfA/exec';

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
        ? `Olá, ${guestData.name} & ${plusOneData.name}!`
        : `Olá, ${guestData.name}!`;

    document.getElementById('mainGuestName').textContent = guestData.name;
    if (document.querySelector(`input[name="mainResponse"][value="${guestData.rsvp}"]`) != null) {
        document.querySelector(`input[name="mainResponse"][value="${guestData.rsvp}"]`).checked = true;
    }
    document.getElementById('children').value = guestData.food;

    if (plusOneData) {
        plusOne = true;
        document.getElementById('plusOneName').textContent = plusOneData.name;
        document.getElementById('plusOneSection').classList.remove('hidden');
        if (document.querySelector(`input[name="plusOneResponse"][value="${plusOneData.rsvp}"]`) != null) {
            document.querySelector(`input[name="plusOneResponse"][value="${plusOneData.rsvp}"]`).checked = true;
        }
    }

    document.getElementById('loadingMessage').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    document.getElementById('fallbackForm').classList.add('hidden');
}

function showRSVPSummary(guestData, plusOneData) {
    console.log(guestData);
    let summaryText = `${guestData.name} ${guestData.rsvp == "Yes" ? "" : "não "}vem.`
    if (plusOne) {
        summaryText += '<br/>';
        summaryText += `${plusOneData.name} ${plusOneData.rsvp == "Yes" ? "" : "não "}vem.`
    }
    if (guestData.food != "") {
        summaryText += '<br/>';
        summaryText += `Também tem ${guestData.food}.`;
    }
    document.getElementById("rsvpSummary").innerHTML = '<p>' + summaryText + '</p>';
    document.getElementById("rsvpSuccess").classList.remove("hidden");
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
            const guestData = { name: data[0][1], rsvp: data[0][3], food: data[0][4] };
            const plusOneData = plusOne && data[1] ? { name: data[1][1], rsvp: data[1][3], food: data[1][4] } : null;

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
            alert('Por favor selecione uma resposta.');
        }
        let mainGuestFood = document.getElementById("children").value;

        const postData = new URLSearchParams({
            row: row,
            response: mainGuestRSVP,
            food: mainGuestFood
        });

        let plusOneRSVP = null;
        let plusOneFood = null;
        if (plusOne) {
            plusOneRSVP = document.querySelector('input[name="plusOneResponse"]:checked').value;
            if (plusOneRSVP == null) {
                alert('Please select your RSVP.');
            }
            plusOneFood = document.getElementById("plusOneFood").value;

            postData.append('plusOneRow', parseInt(row) + 1);
            postData.append('plusOneResponse', plusOneRSVP);
            postData.append('plusOneFood', plusOneFood);
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
                localStorage.setItem('guestData_' + row, JSON.stringify(cachedData));
                if (plusOne) {
                    cachedPlusOneData.rsvp = plusOneRSVP;
                    cachedPlusOneData.food = plusOneFood;
                    localStorage.setItem('guestData_' + (Number(row) + 1), JSON.stringify(cachedPlusOneData));
                }
                document.body.style.cursor = "default";
                showRSVPSummary(cachedData, cachedPlusOneData);
            })
            .catch(error => {
                console.error('Error posting data:', error);
                document.body.style.cursor = "default";
                alert('Erro ao submeter resposta.');
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