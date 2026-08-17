// =========================================================
// API BASE URL CONFIGURATION
// =========================================================
const API_BASE_URL = window.location.origin.includes(":5000")
  ? window.location.origin
  : (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:5000" : window.location.origin);

// ===============================
// ADMIN PAGE PROTECTION
// ===============================

if (window.location.pathname.includes("/admin/")) {
  const adminUserRaw = localStorage.getItem("user");

  if (!adminUserRaw) {
    window.location.href = "../login.html";
  } else {
    try {
      const adminUser = JSON.parse(adminUserRaw);

      if (adminUser.role !== "admin" || !adminUser.token) {
        alert("Access denied. Please login with an admin account.");
        window.location.href = "../login.html";
      }
    } catch (error) {
      localStorage.removeItem("user");
      window.location.href = "../login.html";
    }
  }
}


// ===============================
// MOBILE MENU
// ===============================

const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("mobile-active");
  });
}







// ===============================
// LOGIN
// ===============================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const emailInput = loginForm.querySelector('input[type="email"]');
    const passwordInput = loginForm.querySelector('input[type="password"]');

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    console.log("Login submit:", { email, passwordPresent: !!password });

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
      });

      const data = await response.json();

      if (response.ok) {
        const loggedInUser = { ...data.user, token: data.token };
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        alert("Login successful! Welcome " + data.user.name);
        window.location.href =
          data.user.role === "admin" ? "admin/admin.html" : "index.html";
      } else {
        alert(data.message || "Invalid email or password");
      }

    } catch (error) {
      console.error("Login Error:", error);
      alert("Server se connection nahi ho raha!");
    }
  });
}


// ===============================
// SIGNUP
// ===============================

const signupForm =
  document.getElementById(
    "signupForm"
  );


if (signupForm) {

  signupForm.addEventListener(
    "submit",
    async function (e) {

      e.preventDefault();


      const inputs =
        signupForm.querySelectorAll(
          "input"
        );


      const fullName =
        inputs[0].value.trim();

      const email =
        inputs[1].value.trim();

      const phone =
        inputs[2].value.trim();

      const password =
        inputs[3].value;

      const confirmPassword =
        inputs[4].value;


      // Check password

      if (
        password !==
        confirmPassword
      ) {

        alert(
          "Passwords do not match!"
        );

        return;

      }


      try {

        const response =
          await fetch(
            `${API_BASE_URL}/api/auth/signup`,
            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json"

              },

              body: JSON.stringify({

                name:
                  fullName,

                email:
                  email,

                phone:
                  phone,

                password:
                  password

              })

            }
          );


        const data =
          await response.json();


        if (response.ok) {

          alert(
            "Account created successfully!"
          );


          signupForm.reset();


          window.location.href =
            "login.html";


        } else {

          alert(

            data.message ||

            "Signup failed!"

          );

        }


      } catch (error) {

        console.error(
          "Signup Error:",
          error
        );


        alert(
          "Server se connection nahi ho raha!"
        );

      }

    }
  );

}















// ===============================
// USER LOGIN STATUS
// ===============================

const savedUser =
  localStorage.getItem("user");


// ===============================
// GET NAVBAR ELEMENTS
// ===============================

const loginButtons =
  document.querySelectorAll(
    '#loginBtn, a[href="login.html"], .login-btn'
  );

const signupButtons =
  document.querySelectorAll(
    '#signupBtn, a[href="signup.html"], .signup-btn'
  );

const welcomeUser =
  document.getElementById(
    "welcomeUser"
  );

const adminDashboardBtn =
  document.getElementById(
    "adminDashboardBtn"
  );

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );


// ===============================
// IF USER IS LOGGED IN
// ===============================

if (savedUser) {

  try {

    const user =
      JSON.parse(savedUser);


    // ===============================
    // HIDE ALL LOGIN BUTTONS
    // ===============================

    loginButtons.forEach(
      function (button) {

        button.style.display =
          "none";

      }
    );


    // ===============================
    // HIDE ALL SIGNUP BUTTONS
    // ===============================

    signupButtons.forEach(
      function (button) {

        button.style.display =
          "none";

      }
    );


    // ===============================
    // SHOW USER NAME
    // ===============================

    if (welcomeUser) {

      welcomeUser.style.display =
        "inline-flex";

      welcomeUser.innerHTML =
        `<i class="fas fa-user"></i> ${user.name}`;

    }


    // ===============================
    // SHOW LOGOUT
    // ===============================

    if (logoutBtn) {

      logoutBtn.style.display =
        "inline-block";

    }


    // ===============================
    // ADMIN PANEL
    // ADMIN ONLY
    // ===============================

    if (
      user.role === "admin"
    ) {

      if (adminDashboardBtn) {

        adminDashboardBtn.style.display =
          "inline-flex";

      }

    } else {

      // Make sure normal user
      // cannot see Admin Panel

      if (adminDashboardBtn) {

        adminDashboardBtn.style.display =
          "none";

      }

    }


  } catch (error) {

    console.error(
      "User data error:",
      error
    );

    localStorage.removeItem(
      "user"
    );

  }

} else {

  // ===============================
  // USER NOT LOGGED IN
  // ===============================

  // Show Login

  loginButtons.forEach(
    function (button) {

      button.style.display =
        "";

    }
  );


  // Show Signup

  signupButtons.forEach(
    function (button) {

      button.style.display =
        "";

    }
  );


  // Hide User Name

  if (welcomeUser) {

    welcomeUser.style.display =
      "none";

  }


  // Hide Admin Panel

  if (adminDashboardBtn) {

    adminDashboardBtn.style.display =
      "none";

  }


  // Hide Logout

  if (logoutBtn) {

    logoutBtn.style.display =
      "none";

  }

}
// ===============================
// LOGOUT
// ===============================

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    function () {

      localStorage.removeItem(
        "user"
      );

      localStorage.removeItem(
        "token"
      );

      window.location.href =
        "index.html";

    }
  );

}
// ===============================
// APPLICATION FORM
// ===============================

const applicationForm = document.getElementById("applicationForm");
const summaryUniversity = document.getElementById("summaryUniversity");
const summaryProgram = document.getElementById("summaryProgram");
const summaryLevel = document.getElementById("summaryLevel");
const summaryFees = document.getElementById("summaryFees");
const applicationUniversity = document.getElementById("applicationUniversity");
const applicationProgram = document.getElementById("applicationProgram");
const applicationLevel = document.getElementById("applicationLevel");
const applicationUniversityId = document.getElementById("applicationUniversityId");
const applicationProgramLevel = document.getElementById("applicationProgramLevel");
const applicationOriginalFee = document.getElementById("applicationOriginalFee");
const applicationDiscountFee = document.getElementById("applicationDiscountFee");
const documentHint = document.getElementById("documentHint");
const schoolCertificateField = document.getElementById("schoolCertificateField");
const diplomaField = document.getElementById("diplomaField");
const transcriptField = document.getElementById("transcriptField");
const masterDocumentField = document.getElementById("masterDocumentField");
const passportDocument = document.getElementById("passportDocument");
const certificateDocument = document.getElementById("certificateDocument");
const diplomaDocument = document.getElementById("diplomaDocument");
const transcriptDocument = document.getElementById("transcriptDocument");
const masterDocument = document.getElementById("masterDocument");
const additionalDocuments = document.getElementById("additionalDocuments");
const nextStepBtn = document.getElementById("nextStepBtn");
const prevStepBtn = document.getElementById("prevStepBtn");
const submitApplicationBtn = document.getElementById("submitApplicationBtn");
const reviewDetails = document.getElementById("reviewDetails");
const reviewDocuments = document.getElementById("reviewDocuments");
const applicationSteps = document.querySelectorAll(".application-step");
const progressSteps = document.querySelectorAll(".progress-step");
let currentApplicationStep = 1;

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function showApplicationStep(step) {
  currentApplicationStep = step;
  applicationSteps.forEach((section) => {
    const isActive = section.dataset.step === String(step);
    section.style.display = isActive ? "block" : "none";
    toggleStepFields(section, isActive);
  });
  progressSteps.forEach((item) => {
    item.classList.toggle("active", item.dataset.step === String(step));
  });
  if (prevStepBtn) {
    prevStepBtn.style.display = step > 1 ? "inline-block" : "none";
  }
  if (nextStepBtn) {
    nextStepBtn.style.display = step < 3 ? "inline-block" : "none";
  }
  if (submitApplicationBtn) {
    submitApplicationBtn.style.display = step === 3 ? "inline-block" : "none";
  }
  if (step === 3) {
    updateReviewDetails();
  }
}

function toggleStepFields(section, isActive) {
  // Keep all fields enabled so previously selected files and personal info remain in the form
  // even after the user moves to the next step. Validation is handled by step navigation.
  const controls = section.querySelectorAll("input, select, textarea");
  controls.forEach((control) => {
    if (control.type === "button" || control.type === "submit") {
      return;
    }
    control.disabled = false;
  });
}

function getFileLabel(input) {
  if (!input || !input.files || input.files.length === 0) {
    return "Not uploaded";
  }

  if (input.files.length === 1) {
    return input.files[0].name;
  }

  return Array.from(input.files)
    .map((file) => file.name)
    .join(", ");
}

function updateReviewDetails() {
  if (!reviewDetails) return;
  const universityValue = applicationUniversity ? applicationUniversity.value : "N/A";
  const programValue = applicationProgram ? applicationProgram.value : "N/A";
  const levelValue = applicationLevel ? applicationLevel.value : "N/A";
  const nameValue = document.getElementById("applicationName")?.value || "N/A";
  const emailValue = document.getElementById("applicationEmail")?.value || "N/A";
  const phoneValue = document.getElementById("applicationPhone")?.value || "N/A";
  const countryValue = document.getElementById("applicationCountry")?.value || "N/A";
  const nationalityValue = document.getElementById("applicationNationality")?.value || "N/A";
  const dobValue = document.getElementById("applicationDob")?.value || "N/A";
  const genderValue = document.getElementById("applicationGender")?.value || "N/A";
  const feesValue = applicationDiscountFee ? Number(applicationDiscountFee.value).toLocaleString() : "0";
  const messageValue = document.getElementById("applicationMessage")?.value || "";

  reviewDetails.innerHTML = `
    <h4>Personal Information</h4>
    <p><strong>Full Name:</strong> ${nameValue}</p>
    <p><strong>Email:</strong> ${emailValue}</p>
    <p><strong>Phone:</strong> ${phoneValue}</p>
    <p><strong>University:</strong> ${universityValue}</p>
    <p><strong>Program:</strong> ${programValue}</p>
    <p><strong>Level:</strong> ${levelValue}</p>
    <p><strong>Country:</strong> ${countryValue}</p>
    <p><strong>Nationality:</strong> ${nationalityValue}</p>
    <p><strong>Date of Birth:</strong> ${dobValue}</p>
    <p><strong>Gender:</strong> ${genderValue}</p>
    <p><strong>Discount Fee:</strong> $${feesValue}</p>
    <p><strong>Additional Message:</strong> ${messageValue || "None"}</p>
  `;

  if (reviewDocuments) {
    reviewDocuments.innerHTML = `
      <h4>Uploaded Documents</h4>
      <p><strong>Passport Copy:</strong> ${getFileLabel(passportDocument)}</p>
      <p><strong>Higher School Certificate:</strong> ${getFileLabel(certificateDocument)}</p>
      <p><strong>University Diploma:</strong> ${getFileLabel(diplomaDocument)}</p>
      <p><strong>University Transcript:</strong> ${getFileLabel(transcriptDocument)}</p>
      <p><strong>Master Degree Document:</strong> ${getFileLabel(masterDocument)}</p>
      <p><strong>Other Supporting Documents:</strong> ${getFileLabel(additionalDocuments)}</p>
      <p class="document-hint">Make sure every uploaded document is clear, complete, and original.</p>
    `;
  }
}

async function loadSelectedProgram() {
  if (!applicationForm) {
    return;
  }

  const universityId = getQueryParam("id");
  const programId = getQueryParam("program");

  if (!universityId || !programId) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/universities/${universityId}`);
    const data = await response.json();
    const university = data.university;

    if (!university) {
      return;
    }

    const allPrograms = Object.entries(university.programs)
      .flatMap(([degreeType, list]) =>
        list.map((program) => ({ degreeType, program }))
      );

    const selected = allPrograms.find((item) => item.program._id === programId);

    if (!selected) {
      return;
    }

    const displayLevel =
      selected.degreeType === "bachelors" ? "Bachelor" :
        selected.degreeType === "masters" ? "Master" :
          selected.degreeType === "phd" ? "PhD" :
            "Associate";

    if (applicationUniversity) applicationUniversity.value = university.name;
    if (applicationProgram) applicationProgram.value = selected.program.name;
    if (applicationLevel) applicationLevel.value = displayLevel;
    if (applicationUniversityId) applicationUniversityId.value = university._id;
    if (applicationProgramLevel) applicationProgramLevel.value = displayLevel;
    if (applicationOriginalFee) applicationOriginalFee.value = selected.program.originalFee;
    if (applicationDiscountFee) applicationDiscountFee.value = selected.program.discountFee;

    if (summaryUniversity) summaryUniversity.textContent = `University: ${university.name}`;
    if (summaryProgram) summaryProgram.textContent = `Program: ${selected.program.name}`;
    if (summaryLevel) summaryLevel.textContent = `Level: ${displayLevel}`;
    if (summaryFees) summaryFees.textContent = `Fees: $${Number(selected.program.discountFee).toLocaleString()} (Discount)`;

    if (applicationLevel) {
      applicationLevel.disabled = true;
      applicationLevel.classList.add("readonly-field");
    }

    updateDocumentFields(displayLevel);
    showApplicationStep(1);
  } catch (error) {
    console.error("Load selected program error:", error);
  }
}

function updateDocumentFields(level) {
  if (documentHint) {
    documentHint.textContent = "Required documents are shown below based on your selected level.";
  }

  const isBachelor = level === "Bachelor";
  const isMaster = level === "Master";
  const isPhD = level === "PhD";
  const isAssociate = level === "Associate";

  if (schoolCertificateField) {
    schoolCertificateField.style.display = isBachelor || isAssociate ? "block" : "none";
    const label = schoolCertificateField.querySelector("label");
    if (label) {
      label.textContent = isAssociate ? "Higher School Certificate (PDF)" : "Higher School Certificate (PDF)";
    }
    if (certificateDocument) {
      certificateDocument.required = isBachelor || isAssociate;
    }
  }

  if (diplomaField) {
    diplomaField.style.display = isMaster ? "block" : "none";
    if (diplomaDocument) {
      diplomaDocument.required = isMaster;
    }
  }

  if (transcriptField) {
    transcriptField.style.display = isMaster ? "block" : "none";
    if (transcriptDocument) {
      transcriptDocument.required = isMaster;
    }
  }

  if (masterDocumentField) {
    masterDocumentField.style.display = isPhD ? "block" : "none";
    if (masterDocument) {
      masterDocument.required = isPhD;
    }
  }

  if (passportDocument) {
    passportDocument.required = true;
  }
}

if (nextStepBtn) {
  nextStepBtn.addEventListener("click", function () {
    const currentSection = document.querySelector(`.application-step[data-step="${currentApplicationStep}"]`);
    if (currentSection) {
      const controls = Array.from(currentSection.querySelectorAll("input, select, textarea"))
        .filter(control => !control.disabled && control.type !== "button" && control.type !== "submit");
      for (const control of controls) {
        if (!control.checkValidity()) {
          control.reportValidity();
          return;
        }
      }
    }
    if (currentApplicationStep < 3) {
      showApplicationStep(currentApplicationStep + 1);
    }
  });
}

if (prevStepBtn) {
  prevStepBtn.addEventListener("click", function () {
    if (currentApplicationStep > 1) {
      showApplicationStep(currentApplicationStep - 1);
    }
  });
}

if (applicationForm) {
  loadSelectedProgram();

  if (applicationLevel) {
    applicationLevel.addEventListener("change", function () {
      updateDocumentFields(applicationLevel.value);
    });
  }

  applicationForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(applicationForm);
    if (applicationUniversity && applicationProgram && applicationLevel) {
      formData.set("university", applicationUniversity.value);
      formData.set("program", applicationProgram.value);
      formData.set("level", applicationLevel.value);
    }
    if (applicationOriginalFee) formData.set("originalFee", applicationOriginalFee.value);
    if (applicationDiscountFee) formData.set("discountFee", applicationDiscountFee.value);

    try {
      const response = await fetch(`${API_BASE_URL}/api/applications`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.message || "Application submitted successfully!");
        applicationForm.reset();
        window.location.href = "universities.html";
      } else {
        alert(data.message || "Failed to submit application.");
      }
    } catch (error) {
      console.error("Application Error:", error);
      alert("Server se connection nahi ho raha!");
    }
  });
}



// ===============================
// SCROLL ANIMATION
// ===============================

const boxes =
  document.querySelectorAll(
    ".service-box, .process-box, .university-card"
  );


if (boxes.length > 0) {

  const observer =
    new IntersectionObserver(
      (entries) => {

        entries.forEach(
          entry => {

            if (
              entry.isIntersecting
            ) {

              entry.target.style.opacity =
                "1";

              entry.target.style.transform =
                "translateY(0)";

            }

          }
        );

      },
      {
        threshold: 0.1
      }
    );


  boxes.forEach(
    box => {

      box.style.opacity =
        "0";

      box.style.transform =
        "translateY(30px)";

      box.style.transition =
        "all 0.6s ease";

      observer.observe(
        box
      );

    }
  );

}

















// ========================================
// ADMIN - ADD UNIVERSITY & PROGRAMS
// ========================================

const universityForm = document.getElementById("universityForm");
const addProgramBtn = document.getElementById("addProgramBtn");
const programList = document.getElementById("programList");

// Store programs by degree type
let programs = {
  associate: [],
  bachelors: [],
  masters: [],
  phd: []
};


// ========================================
// ADD PROGRAM
// ========================================

if (addProgramBtn) {

  addProgramBtn.addEventListener("click", function (e) {

    e.preventDefault();

    // Get values
    const levelElement = document.getElementById("programLevel");
    const nameElement = document.getElementById("programName");
    const durationElement = document.getElementById("programYears");
    const originalFeeElement = document.getElementById("programOriginalFee");
    const discountFeeElement = document.getElementById("programDiscountFee");

    const level = levelElement.value;
    const name = nameElement.value.trim();
    const language = document.getElementById("programLanguage")?.value || "English";
    const duration = durationElement.value.trim();
    const originalFee = originalFeeElement.value.trim();
    const discountFee = discountFeeElement.value.trim();


    // ========================================
    // VALIDATE PROGRAM FIELDS
    // ========================================

    if (!name) {
      alert("Please enter program name!");
      nameElement.focus();
      return;
    }

    if (!duration) {
      alert("Please enter program duration!");
      durationElement.focus();
      return;
    }

    if (!originalFee) {
      alert("Please enter original fee!");
      originalFeeElement.focus();
      return;
    }

    if (!discountFee) {
      alert("Please enter discount fee!");
      discountFeeElement.focus();
      return;
    }


    // ========================================
    // DEGREE LEVEL MAP
    // ========================================

    const degreeMap = {
      "Bachelor": "bachelors",
      "Associate": "associate",
      "Master": "masters",
      "PhD": "phd"
    };

    const degreeType = degreeMap[level];

    if (!degreeType) {
      alert("Invalid degree level!");
      return;
    }


    // ========================================
    // CREATE PROGRAM OBJECT
    // ========================================

    const program = {

      name: name,

      language: language,

      duration: duration,

      originalFee: Number(
        originalFee.replace(/[^0-9.]/g, "")
      ) || 0,

      discountFee: Number(
        discountFee.replace(/[^0-9.]/g, "")
      ) || 0,

      description: ""

    };


    // ========================================
    // ADD PROGRAM TO ARRAY
    // ========================================

    programs[degreeType].push(program);


    // ========================================
    // DISPLAY PROGRAMS
    // ========================================

    displayPrograms();


    // ========================================
    // CLEAR PROGRAM INPUTS
    // ========================================

    nameElement.value = "";
    document.getElementById("programLanguage").value = "English";
    durationElement.value = "";
    originalFeeElement.value = "";
    discountFeeElement.value = "";


    alert(
      `${level} program added successfully!`
    );

  });

}


// ========================================
// DISPLAY ALL PROGRAMS
// ========================================

function displayPrograms() {

  if (!programList) {
    return;
  }


  // Combine all programs
  const allPrograms = [];


  Object.keys(programs).forEach(function (degreeType) {

    programs[degreeType].forEach(function (program, index) {

      allPrograms.push({

        degreeType: degreeType,

        program: program,

        index: index

      });

    });

  });


  // If no programs
  if (allPrograms.length === 0) {

    programList.innerHTML = `
      <p class="empty-program">
        No programs added yet.
      </p>
    `;

    return;

  }


  // ========================================
  // SHOW PROGRAMS
  // ========================================

  programList.innerHTML = "";


  allPrograms.forEach(function (item) {

    const program = item.program;

    const degreeType = item.degreeType;

    const index = item.index;


    // Convert degree type to display name
    const degreeNames = {

      associate: "Associate",

      bachelors: "Bachelor",

      masters: "Master",

      phd: "PhD"

    };


    const programCard = document.createElement("div");

    programCard.className = "program-card";


    programCard.innerHTML = `

      <div class="program-info">

        <h4>
          ${program.name}
        </h4>

        <p>
          <strong>Degree:</strong>
          ${degreeNames[degreeType]}
        </p>

        <p>
          <strong>Language:</strong>
          ${program.language || "English"}
        </p>

        <p>
          <strong>Duration:</strong>
          ${program.duration}
        </p>

        <p>
          <strong>Original Fee:</strong>
          $${program.originalFee.toLocaleString()}
        </p>

        <p>
          <strong>Discount Fee:</strong>
          $${program.discountFee.toLocaleString()}
        </p>

      </div>


      <button
        type="button"
        class="remove-program-btn"
        data-degree="${degreeType}"
        data-index="${index}"
      >

        <i class="fas fa-trash"></i>

        Remove

      </button>

    `;


    programList.appendChild(programCard);

  });


  // ========================================
  // REMOVE PROGRAM BUTTONS
  // ========================================

  const removeButtons =
    document.querySelectorAll(".remove-program-btn");


  removeButtons.forEach(function (button) {

    button.addEventListener("click", function () {

      const degreeType =
        this.getAttribute("data-degree");

      const index =
        Number(
          this.getAttribute("data-index")
        );


      // Remove selected program
      programs[degreeType].splice(
        index,
        1
      );


      // Refresh list
      displayPrograms();

    });

  });

}





// ===============================
// ADD UNIVERSITY
// ===============================



if (universityForm) {

  universityForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.token) {
      alert("Please login as Admin.");
      return;
    }

    const imageValue = document.getElementById("universityImage").value.trim();

    if (imageValue && !/^https?:\/\//i.test(imageValue)) {
      alert("University image URL must start with http:// or https://");
      return;
    }

    const universityData = {
      name: document.getElementById("universityName").value.trim(),
      location: document.getElementById("universityLocation").value.trim(),
      description: document.getElementById("universityDescription").value.trim(),
      image: imageValue,
      programs
    };

    console.log("Submitting university:", universityData);

    try {

      const response = await fetch(`${API_BASE_URL}/api/universities`, {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`
        },

        body: JSON.stringify(universityData)

      });

      const data = await response.json();

      if (response.ok) {

        alert("University Added Successfully!");

        universityForm.reset();

        programs = {
          associate: [],
          bachelors: [],
          masters: [],
          phd: []
        };

        displayPrograms();

      } else {

        alert(data.message || "Failed to add university.");

      }

    } catch (error) {

      console.error(error);

      alert("Server Error");

    }

  });

}




























// ========================================
// SHOW UNIVERSITIES ON WEBSITE
// ========================================

const universityList = document.getElementById("universityList");


async function loadUniversities() {

  if (!universityList) {
    return;
  }


  try {

    const response = await fetch(
      `${API_BASE_URL}/api/universities`
    );

    const data = await response.json();

    const universities = data.universities || [];

    if (universities.length === 0) {
      universityList.innerHTML = `
    <div class="empty-program">
      <p>No universities have been added yet. Please check back soon.</p>
    </div>
  `;
      return;
    }

    universityList.innerHTML = "";


    universities.forEach((uni) => {


      let totalPrograms =
        Object.values(uni.programs)
          .flat()
          .length;



      universityList.innerHTML += `

<div class="university-card">

  ${uni.image ? `
    <div class="university-image">
      <img src="${uni.image}" alt="${uni.name}">
    </div>
  ` : `
    <div class="university-image">
      <i class="fas fa-university"></i>
    </div>
  `}

  <div class="university-info">
    <h3>${uni.name}</h3>

    <p>
      <i class="fas fa-location-dot"></i>
      ${uni.location}
    </p>

    <p>
      <i class="fas fa-graduation-cap"></i>
      ${totalPrograms} Programs
    </p>

    <div class="university-actions">
      <a href="university.html?id=${uni._id}" class="primary-btn">Visit University</a>
    </div>
  </div>

</div>
`;

    });


  }

  catch (error) {

    console.log(error);
    universityList.innerHTML = `
  <div class="empty-program">
    <p>Unable to load universities. Make sure the backend server is running on port 5000.</p>
  </div>
`;

  }


}


loadUniversities();
loadUniversityDetails();
loadProgramDetails();

async function loadUniversityDetails() {
  const detailContainer = document.getElementById("universityDetail");
  const programListContainer = document.getElementById("programListContainer");

  if (!detailContainer || !programListContainer) {
    return;
  }

  const universityId = getQueryParam("id");
  if (!universityId) {
    detailContainer.innerHTML = `<p class="empty-program">University not selected.</p>`;
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/universities/${universityId}`);
    const data = await response.json();
    const university = data.university;

    if (!university) {
      detailContainer.innerHTML = `<p class="empty-program">University not found.</p>`;
      return;
    }

    detailContainer.innerHTML = `
      <div class="university-detail-card">
        <div class="university-image">
          ${university.image ? `<img src="${university.image}" alt="${university.name}">` : `<i class="fas fa-university"></i>`}
        </div>
        <div class="university-detail-info">
          <h2>${university.name}</h2>
          <p><i class="fas fa-location-dot"></i> ${university.location}</p>
          <p>${university.description || "No description available."}</p>
        </div>
      </div>
    `;

    const programs = Object.entries(university.programs)
      .flatMap(([degreeType, list]) =>
        list.map((program) => ({ degreeType, program }))
      );

    if (programs.length === 0) {
      programListContainer.innerHTML = `<p class="empty-program">No programs available for this university.</p>`;
      return;
    }

    const activeLanguage = renderLanguageTabs(university);
    const activeDegree = renderDegreeTabs(university);
    if (activeDegree && activeLanguage) {
      renderProgramList(university, activeDegree, activeLanguage);
    } else {
      const fallbackDegree = Object.keys(university.programs).find((type) => (university.programs[type] || []).length > 0) || "bachelors";
      renderProgramList(university, fallbackDegree, activeLanguage || "English");
    }
  } catch (error) {
    console.error("Load university details error:", error);
    detailContainer.innerHTML = `<p class="empty-program">Unable to load university details.</p>`;
  }
}

function renderDegreeTabs(university) {
  const degreeTabs = document.getElementById("degreeTabs");
  if (!degreeTabs) {
    return null;
  }

  const degreeNames = {
    associate: "Associate",
    bachelors: "Bachelor",
    masters: "Master",
    phd: "PhD"
  };

  const degreeOrder = ["bachelors", "masters", "phd", "associate"];
  const degrees = degreeOrder.map((type) => ({
    type,
    label: degreeNames[type],
    count: university.programs[type]?.length || 0
  }));

  degreeTabs.innerHTML = degrees
    .map((degree) => {
      const disabled = degree.count === 0 ? "disabled" : "";
      return `
        <button type="button" class="degree-tab ${disabled ? "disabled" : ""}" data-degree="${degree.type}" ${disabled}>
          ${degree.label} (${degree.count})
        </button>
      `;
    })
    .join("");

  const buttons = degreeTabs.querySelectorAll(".degree-tab");
  buttons.forEach((button) => {
    button.addEventListener("click", function () {
      if (this.disabled) return;
      buttons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");
      const selectedLanguage = document.querySelector(".language-tab.active")?.getAttribute("data-language") || "English";
      renderProgramList(university, this.getAttribute("data-degree"), selectedLanguage);
    });
  });

  const firstActiveTab = degreeTabs.querySelector(".degree-tab:not(.disabled)");
  if (firstActiveTab) {
    buttons.forEach((btn) => btn.classList.remove("active"));
    firstActiveTab.classList.add("active");
    return firstActiveTab.getAttribute("data-degree");
  }

  return null;
}

function renderLanguageTabs(university) {
  const languageTabs = document.getElementById("languageTabs");
  if (!languageTabs) {
    return "English";
  }

  const availableLanguages = ["English", "Turkish"];

  languageTabs.innerHTML = availableLanguages
    .map((language) => {
      return `<button type="button" class="language-tab" data-language="${language}">${language}</button>`;
    })
    .join("");

  const buttons = languageTabs.querySelectorAll(".language-tab");
  buttons.forEach((button) => {
    button.addEventListener("click", function () {
      buttons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");
      const activeDegree = document.querySelector(".degree-tab.active")?.getAttribute("data-degree") || "bachelors";
      renderProgramList(university, activeDegree, this.getAttribute("data-language"));
    });
  });

  const firstActiveTab = buttons[0];
  if (firstActiveTab) {
    buttons.forEach((btn) => btn.classList.remove("active"));
    firstActiveTab.classList.add("active");
    return firstActiveTab.getAttribute("data-language");
  }

  return "English";
}











function renderProgramList(university, degreeType, language) {
  const programListContainer = document.getElementById("programListContainer");
  if (!programListContainer) {
    return;
  }








function renderProgramList(university, degreeType, language) {
  const programListContainer =
    document.getElementById("programListContainer");

  if (!programListContainer) {
    return;
  }

  const programs = university.programs[degreeType] || [];

  const degreeNames = {
    associate: "Associate",
    bachelors: "Bachelor",
    masters: "Master",
    phd: "PhD"
  };

  const displayLevel =
    degreeNames[degreeType] || "Program";

  const selectedLanguage =
    language || "English";

  const filteredPrograms = programs.filter((program) => {

    const programLanguage =
      (program.language || "English").toString();

    return (
      programLanguage.toLowerCase() ===
      selectedLanguage.toLowerCase()
    );

  });

  if (filteredPrograms.length === 0) {

    programListContainer.innerHTML = `
      <p class="empty-program">
        No ${selectedLanguage} ${displayLevel}
        programs available.
        Try another degree or language.
      </p>
    `;

    return;
  }


  // ========================================
  // PROGRAM CARDS
  // ========================================

  programListContainer.innerHTML = filteredPrograms
    .map((program) => {

      const universityImage =
        university.image || "";

      return `
        <div class="program-card">

          <!-- PROGRAM IMAGE -->
          <div class="program-card-image">

            ${
              universityImage
                ? `
                  <img
                    src="${universityImage}"
                    alt="${program.name}"
                    loading="lazy"
                  >
                `
                : `
                  <div class="program-placeholder">
                    <i class="fas fa-graduation-cap"></i>
                  </div>
                `
            }

            <div class="program-level-badge">
              ${displayLevel}
            </div>

          </div>


          <!-- PROGRAM INFORMATION -->
          <div class="program-info">

            <h4>
              ${program.name}
            </h4>

            <p>
              <strong>Language:</strong>
              ${program.language || "English"}
            </p>

            <p>
              <strong>Duration:</strong>
              ${program.duration || "N/A"}
            </p>

            <div class="program-fees">

              <p>
                <strong>Original Fee:</strong>
                $${Number(
                  program.originalFee || 0
                ).toLocaleString()}
              </p>

              <p class="discount-fee">
                <strong>Discount Fee:</strong>
                $${Number(
                  program.discountFee || 0
                ).toLocaleString()}
              </p>

            </div>

          </div>


          <!-- BUTTON -->
          <div class="program-card-actions">

            <a
              href="program.html?id=${university._id}&program=${program._id}&degree=${degreeType}"
              class="primary-btn"
            >
              View Program
            </a>

          </div>

        </div>
      `;

    })
    .join("");
}

















  const programs = university.programs[degreeType] || [];
  const degreeNames = {
    associate: "Associate",
    bachelors: "Bachelor",
    masters: "Master",
    phd: "PhD"
  };
  const displayLevel = degreeNames[degreeType] || "Program";
  const selectedLanguage = language || "English";

  const filteredPrograms = programs.filter((program) => {
    const programLanguage = (program.language || "English").toString();
    return programLanguage.toLowerCase() === selectedLanguage.toLowerCase();
  });

  if (filteredPrograms.length === 0) {
    programListContainer.innerHTML = `<p class="empty-program">No ${selectedLanguage} ${displayLevel} programs available. Try another degree or language.</p>`;
    return;
  }

  programListContainer.innerHTML = filteredPrograms
    .map((program) => {
      return `
        <div class="program-card">
          <div class="program-info">
            <h4>${program.name}</h4>
            <p><strong>Language:</strong> ${program.language || "English"}</p>
            <p><strong>Level:</strong> ${displayLevel}</p>
            <p><strong>Duration:</strong> ${program.duration}</p>
            <p><strong>Original Fee:</strong> $${Number(program.originalFee).toLocaleString()}</p>
            <p><strong>Discount Fee:</strong> $${Number(program.discountFee).toLocaleString()}</p>
          </div>
          <div class="program-card-actions">
            <a href="program.html?id=${university._id}&program=${program._id}&degree=${degreeType}" class="primary-btn">View Program</a>
          </div>
        </div>
      `;
    })
    .join("");
}

async function loadProgramDetails() {
  const container = document.getElementById("programDetailContainer");
  if (!container) {
    return;
  }

  const universityId = getQueryParam("id");
  const programId = getQueryParam("program");
  const degreeType = getQueryParam("degree");

  if (!universityId || !programId) {
    container.innerHTML = `<p class="empty-program">Program not selected.</p>`;
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/universities/${universityId}`);
    const data = await response.json();
    const university = data.university;

    if (!university) {
      container.innerHTML = `<p class="empty-program">University not found.</p>`;
      return;
    }

    const degreeNames = {
      associate: "Associate",
      bachelors: "Bachelor",
      masters: "Master",
      phd: "PhD"
    };

    const searchTypes = degreeType ? [degreeType] : Object.keys(university.programs);
    let selectedProgram = null;
    let selectedDegreeType = degreeType || "";

    for (const type of searchTypes) {
      const match = (university.programs[type] || []).find(
        (program) => program._id === programId
      );
      if (match) {
        selectedProgram = match;
        selectedDegreeType = type;
        break;
      }
    }

    if (!selectedProgram) {
      container.innerHTML = `<p class="empty-program">Program not found.</p>`;
      return;
    }

    const displayLevel = degreeNames[selectedDegreeType] || "Program";

    container.innerHTML = `
      <div class="program-detail-card">
        <div class="program-detail-header">
          <span class="program-level">${displayLevel}</span>
          <h2>${selectedProgram.name}</h2>
          <p><strong>University:</strong> ${university.name}</p>
          <p><i class="fas fa-location-dot"></i> ${university.location}</p>
        </div>

        <div class="program-detail-body">
          <p><strong>Language:</strong> ${selectedProgram.language || "English"}</p>
          <p><strong>Duration:</strong> ${selectedProgram.duration || "N/A"}</p>
          <p><strong>Original Fee:</strong> $${Number(selectedProgram.originalFee).toLocaleString()}</p>
          <p><strong>Discount Fee:</strong> $${Number(selectedProgram.discountFee).toLocaleString()}</p>
          <p>${selectedProgram.description || "This program is available for international students through Admission Turkey."}</p>
        </div>

        <div class="apply-banner">
          <h3>You can apply to this program</h3>
          <p>Start your application and upload your educational documents in the next steps.</p>
          <div class="program-card-actions">
            <a href="application.html?id=${university._id}&program=${selectedProgram._id}" class="primary-btn">Apply Now</a>
            <a href="university.html?id=${university._id}" class="secondary-btn">Back to Programs</a>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Load program details error:", error);
    container.innerHTML = `<p class="empty-program">Unable to load program details.</p>`;
  }
}













































// ========================================
// ADMIN DASHBOARD COUNTS
// ========================================


async function loadAdminDashboard() {


  const universityCount =
    document.getElementById("universityCount");


  const programCount =
    document.getElementById("programCount");

  const applicationCount =
    document.getElementById("applicationCount");



  if (!universityCount) {
    return;
  }



  try {


    const response =
      await fetch(
        `${API_BASE_URL}/api/universities`
      );



    const data =
      await response.json();

    const universities = data.universities || [];



    universityCount.innerHTML =
      universities.length;



    let totalPrograms = 0;



    universities.forEach((uni) => {


      totalPrograms +=
        Object.values(uni.programs)
          .flat()
          .length;


    });


    programCount.innerHTML =
      totalPrograms;

    if (applicationCount) {
      const user = JSON.parse(localStorage.getItem("user"));

      if (user && user.token) {
        const appResponse = await fetch(`${API_BASE_URL}/api/applications`, {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });

        if (appResponse.ok) {
          const appData = await appResponse.json();
          applicationCount.innerHTML = (appData.applications || []).length;
        }
      }
    }



  }

  catch (error) {

    console.log(error);

  }


}


loadAdminDashboard();


















// ========================================
// MANAGE UNIVERSITIES (ADMIN)
// ========================================

const manageUniversityList =
  document.getElementById("manageUniversityList");


async function loadManageUniversities() {


  if (!manageUniversityList) {
    return;
  }


  try {


    const user =
      JSON.parse(localStorage.getItem("user"));



    const response = await fetch(
      `${API_BASE_URL}/api/universities`,
      {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      }
    );



    const data =
      await response.json();

    const universities = data.universities || [];



    manageUniversityList.innerHTML = "";



    if (universities.length === 0) {

      manageUniversityList.innerHTML = `

<div class="empty-program">

No Universities Added Yet.

</div>

`;

      return;

    }




    universities.forEach((uni, index) => {


      let totalPrograms =
        Object.values(uni.programs)
          .flat()
          .length;



      manageUniversityList.innerHTML += `


<div class="program-card">


<div class="program-info">


<h3>

${index + 1}. ${uni.name}

</h3>


<p>

<strong>Location:</strong>

${uni.location}

</p>



<p>

<strong>Total Programs:</strong>

${totalPrograms}

</p>



<p>

<strong>Description:</strong>

${uni.description || "No description"}

</p>



</div>



<div>


<button 
class="remove-program-btn"
onclick="deleteUniversity('${uni._id}')">

<i class="fas fa-trash"></i>

Delete

</button>


</div>



</div>


`;



    });


  }


  catch (error) {

    console.log(
      "Manage University Error:",
      error
    );

  }


}



loadManageUniversities();


























// ========================================
// DELETE UNIVERSITY
// ========================================


async function deleteUniversity(id) {


  const user =
    JSON.parse(localStorage.getItem("user"));



  if (!confirm("Are you sure you want to delete this university?")) {
    return;
  }



  try {


    const response =
      await fetch(

        `${API_BASE_URL}/api/universities/${id}`,

        {

          method: "DELETE",

          headers: {

            Authorization:
              `Bearer ${user.token}`

          }

        }

      );



    const data =
      await response.json();



    if (response.ok) {

      alert("University Deleted Successfully!");


      loadManageUniversities();


    }
    else {

      alert(
        data.message || "Delete Failed"
      );

    }


  }

  catch (error) {

    console.log(error);

  }

}


// =========================================================
// HIGH-LEVEL ANIMATION SYSTEM 1: INTERACTIVE PARTICLE CANVAS ENGINE
// =========================================================

class ParticleCanvasEngine {
  constructor(canvasElement) {
    if (!canvasElement) return;
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.particleCount = 40;
    this.mouse = { x: null, y: null, radius: 130 };
    this.animId = null;
    this.isIntersecting = true;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });

    const parent = this.canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      }, { passive: true });

      parent.addEventListener('mouseleave', () => {
        this.mouse.x = null;
        this.mouse.y = null;
      }, { passive: true });
    }

    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2.2 + 1,
        alpha: Math.random() * 0.4 + 0.3
      });
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        this.isIntersecting = entries[0].isIntersecting;
        if (this.isIntersecting && !this.animId) {
          this.animate();
        }
      });
      observer.observe(this.canvas.parentElement || this.canvas);
    }

    this.animate();
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    this.canvas.width = parent.clientWidth || window.innerWidth;
    this.canvas.height = parent.clientHeight || 350;
  }

  animate() {
    if (!this.isIntersecting) {
      this.animId = null;
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.particles.length; i++) {
      let p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

      if (this.mouse.x !== null && this.mouse.y !== null) {
        let dx = this.mouse.x - p.x;
        let dy = this.mouse.y - p.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.mouse.radius) {
          p.x += dx * 0.015;
          p.y += dy * 0.015;
        }
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(209, 26, 34, ${p.alpha})`;
      this.ctx.fill();

      for (let j = i + 1; j < this.particles.length; j++) {
        let p2 = this.particles[j];
        let dx = p.x - p2.x;
        let dy = p.y - p2.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(29, 91, 191, ${0.22 * (1 - dist / 110)})`;
          this.ctx.lineWidth = 0.8;
          this.ctx.stroke();
        }
      }
    }

    this.animId = requestAnimationFrame(() => this.animate());
  }
}

// =========================================================
// HIGH-LEVEL ANIMATION SYSTEM 2: 3D CARD TILT & SCROLL-REVEAL ENGINE
// =========================================================

function init3DCardTilt() {
  const tiltElements = document.querySelectorAll(
    '.hero-card, .service-box, .university-card, .admin-stat-card, .admin-action-card, .process-box, .why-circle'
  );

  tiltElements.forEach(card => {
    card.classList.add('tilt-card');

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  });
}

function initScrollRevealEngine() {
  const revealTargets = document.querySelectorAll(
    '.section-heading, .service-box, .process-box, .why-content, .hero-content, .admin-welcome, .admin-stat-card, .admin-action-card, .contact-grid, .booking-grid, .about-grid, .university-card'
  );

  revealTargets.forEach((el) => {
    if (!el.classList.contains('reveal-init')) {
      el.classList.add('reveal-init', 'reveal-up');
    }
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const parentGrid = entry.target.parentElement;
          if (parentGrid && (parentGrid.classList.contains('services-grid') || parentGrid.classList.contains('process-grid') || parentGrid.classList.contains('admin-stats') || parentGrid.classList.contains('admin-actions'))) {
            const siblings = Array.from(parentGrid.children);
            const idx = siblings.indexOf(entry.target);
            entry.target.style.transitionDelay = `${(idx % 4) * 0.12}s`;
          }

          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealTargets.forEach(el => observer.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('revealed'));
  }
}

// Auto-initialize canvas and animations
document.addEventListener('DOMContentLoaded', () => {
  const heroSection = document.querySelector('.hero, .page-hero');
  if (heroSection) {
    let heroCanvas = document.getElementById('particleCanvas');
    if (!heroCanvas) {
      heroCanvas = document.createElement('canvas');
      heroCanvas.id = 'particleCanvas';
      heroCanvas.className = 'particle-canvas-bg';
      heroSection.prepend(heroCanvas);
    }
    new ParticleCanvasEngine(heroCanvas);
  }

  const adminCanvas = document.getElementById('adminParticleCanvas');
  if (adminCanvas) {
    new ParticleCanvasEngine(adminCanvas);
  }

  init3DCardTilt();
  initScrollRevealEngine();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => {
    const heroSection = document.querySelector('.hero, .page-hero');
    if (heroSection && !document.getElementById('particleCanvas')) {
      const heroCanvas = document.createElement('canvas');
      heroCanvas.id = 'particleCanvas';
      heroCanvas.className = 'particle-canvas-bg';
      heroSection.prepend(heroCanvas);
      new ParticleCanvasEngine(heroCanvas);
    }

    const adminCanvas = document.getElementById('adminParticleCanvas');
    if (adminCanvas) {
      new ParticleCanvasEngine(adminCanvas);
    }

    init3DCardTilt();
    initScrollRevealEngine();
  }, 100);
}



































/* =========================================
   ADVANCED 3D MOUSE TILT
========================================= */

document.addEventListener("mousemove", (e) => {

  const cards = document.querySelectorAll(".program-card");

  cards.forEach((card) => {

    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX =
      ((y - centerY) / centerY) * -7;

    const rotateY =
      ((x - centerX) / centerX) * 7;

    const distanceX =
      Math.abs(x - centerX);

    const distanceY =
      Math.abs(y - centerY);

    const insideCard =
      x >= 0 &&
      x <= rect.width &&
      y >= 0 &&
      y <= rect.height;

    if (insideCard) {

      card.style.setProperty(
        "--mouse-x",
        `${(x / rect.width) * 100}%`
      );

      card.style.setProperty(
        "--mouse-y",
        `${(y / rect.height) * 100}%`
      );

      card.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale3d(1.025, 1.025, 1.025)
      `;

    } else {

      card.style.transform = "";

    }

  });

});

// =========================================================
// API BASE URL CONFIGURATION (already declared at top of file)
// =========================================================

// =========================================================
// MANAGE APPLICATIONS & DOCUMENT PREVIEW SYSTEM (ADMIN)
// =========================================================
const manageApplicationList = document.getElementById("manageApplicationList");
let allApplicationsList = [];

async function loadManageApplications() {
  if (!manageApplicationList) return;

  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) {
      manageApplicationList.innerHTML = `
        <div class="empty-program">
          <i class="fas fa-lock" style="font-size: 30px; color: var(--red); margin-bottom: 10px;"></i>
          <p>Admin authentication required. Please login first.</p>
          <a href="../login.html" class="primary-btn" style="margin-top: 15px; display: inline-block;">Login to Admin</a>
        </div>
      `;
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/applications`, {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      manageApplicationList.innerHTML = `
        <div class="empty-program">
          <p class="error-msg">${data.message || "Failed to load applications."}</p>
        </div>
      `;
      return;
    }

    allApplicationsList = data.applications || [];
    renderApplications(allApplicationsList);
  } catch (error) {
    console.error("Manage Applications Error:", error);
    manageApplicationList.innerHTML = `
      <div class="empty-program">
        <p style="color: var(--red);">Error connecting to backend server (${API_BASE_URL}). Please make sure MongoDB & Node server are running.</p>
      </div>
    `;
  }
}

function renderApplications(apps) {
  const countEl = document.getElementById("totalAppsCount");
  if (countEl) countEl.innerText = apps.length;

  if (!manageApplicationList) return;

  if (apps.length === 0) {
    manageApplicationList.innerHTML = `
      <div class="empty-program">
        <i class="fas fa-folder-open" style="font-size: 36px; color: var(--gray); margin-bottom: 10px; display: block;"></i>
        No Applications Found.
      </div>
    `;
    return;
  }

  manageApplicationList.innerHTML = "";

  apps.forEach((app, index) => {
    // Format Date
    const dateStr = app.createdAt ? new Date(app.createdAt).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    }) : "N/A";

    // Collect all documents
    const docList = [];

    if (app.passportDocument) {
      docList.push({ label: "Passport", url: app.passportDocument, icon: "fa-id-card", type: "passport" });
    }
    if (app.certificateDocument) {
      docList.push({ label: "High School Certificate", url: app.certificateDocument, icon: "fa-certificate", type: "certificate" });
    }
    if (app.diplomaDocument) {
      docList.push({ label: "High School Diploma", url: app.diplomaDocument, icon: "fa-graduation-cap", type: "diploma" });
    }
    if (app.transcriptDocument) {
      docList.push({ label: "Transcript", url: app.transcriptDocument, icon: "fa-file-invoice", type: "transcript" });
    }
    if (app.masterDocument) {
      docList.push({ label: "Master Degree / Doc", url: app.masterDocument, icon: "fa-award", type: "master" });
    }
    if (Array.isArray(app.additionalDocuments)) {
      app.additionalDocuments.forEach((addUrl, idx) => {
        if (addUrl) {
          docList.push({ label: `Additional Document #${idx + 1}`, url: addUrl, icon: "fa-file-medical", type: "additional" });
        }
      });
    }

    // Status Class
    let statusClass = "status-pending";
    const statusVal = (app.status || "Pending").trim();
    if (statusVal === "Under Review") statusClass = "status-review";
    else if (statusVal === "Approved") statusClass = "status-approved";
    else if (statusVal === "Rejected") statusClass = "status-rejected";

    // Render HTML for documents
    let docsHTML = "";
    if (docList.length === 0) {
      docsHTML = `<p class="no-docs-text"><i class="fas fa-exclamation-circle"></i> No user documents uploaded for this application.</p>`;
    } else {
      docsHTML = `<div class="docs-grid">`;
      docList.forEach(doc => {
        const fullUrl = doc.url.startsWith("http") ? doc.url : `${API_BASE_URL}${doc.url.startsWith('/') ? '' : '/'}${doc.url}`;
        const isPdf = doc.url.toLowerCase().endsWith(".pdf");
        const isImg = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(doc.url);
        const fileExt = doc.url.split('.').pop().toUpperCase();

        const iconClass = isPdf ? "pdf" : (isImg ? "image" : "");
        const displayIcon = isPdf ? "fa-file-pdf" : (isImg ? "fa-file-image" : "fa-file-alt");

        docsHTML += `
          <div class="doc-card-item">
            <div class="doc-info">
              <div class="doc-icon ${iconClass}">
                <i class="fas ${displayIcon}"></i>
              </div>
              <div class="doc-details">
                <h5>${doc.label}</h5>
                <p>${fileExt} File</p>
              </div>
            </div>
            <div class="doc-actions">
              <button class="doc-btn doc-btn-preview" onclick="openDocPreview('${fullUrl}', '${doc.label} - ${app.name}')">
                <i class="fas fa-eye"></i> Preview
              </button>
              <a href="${fullUrl}" target="_blank" download="${doc.label}-${app.name}" class="doc-btn doc-btn-download">
                <i class="fas fa-download"></i> Download
              </a>
            </div>
          </div>
        `;
      });
      docsHTML += `</div>`;
    }

    // Build Card HTML
    manageApplicationList.innerHTML += `
      <div class="app-card" id="appCard-${app._id}">
        <div class="app-card-header">
          <div class="app-card-title">
            <h3><i class="fas fa-user-graduate" style="color: var(--blue);"></i> ${app.name}</h3>
            <p><i class="far fa-clock"></i> Submitted: ${dateStr}</p>
          </div>
          <div class="app-card-status-box">
            <span class="status-badge ${statusClass}">${statusVal}</span>
            <select class="app-status-select" onchange="updateApplicationStatus('${app._id}', this.value)">
              <option value="Pending" ${statusVal === "Pending" ? "selected" : ""}>Pending</option>
              <option value="Under Review" ${statusVal === "Under Review" ? "selected" : ""}>Under Review</option>
              <option value="Approved" ${statusVal === "Approved" ? "selected" : ""}>Approved</option>
              <option value="Rejected" ${statusVal === "Rejected" ? "selected" : ""}>Rejected</option>
            </select>
          </div>
        </div>

        <div class="app-meta-grid">
          <div class="meta-item">
            <strong>Email</strong>
            <span>${app.email || "N/A"}</span>
          </div>
          <div class="meta-item">
            <strong>Phone / WhatsApp</strong>
            <span>${app.phone || "N/A"}</span>
          </div>
          <div class="meta-item">
            <strong>Country / Nationality</strong>
            <span>${app.country || "N/A"} / ${app.nationality || "N/A"}</span>
          </div>
          <div class="meta-item">
            <strong>Target University</strong>
            <span>${app.university || "N/A"}</span>
          </div>
          <div class="meta-item">
            <strong>Program & Level</strong>
            <span>${app.program || "N/A"} (${app.level || "N/A"})</span>
          </div>
          <div class="meta-item">
            <strong>Tuition Fee</strong>
            <span>$${app.discountFee || app.originalFee || 0}</span>
          </div>
          <div class="meta-item">
            <strong>DOB / Gender</strong>
            <span>${app.dob || "N/A"} / ${app.gender || "N/A"}</span>
          </div>
        </div>

        ${app.message ? `
          <div style="background: #fff8e6; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 16px; font-size: 14px;">
            <strong><i class="fas fa-comment-dots"></i> Student Note:</strong> ${app.message}
          </div>
        ` : ""}

        <div class="app-docs-section">
          <h4><i class="fas fa-paperclip"></i> Uploaded Documents (${docList.length})</h4>
          ${docsHTML}
        </div>

        <div class="app-actions-footer">
          <button class="delete-app-btn" onclick="deleteApplicationRecord('${app._id}')">
            <i class="fas fa-trash-alt"></i> Delete Application
          </button>
        </div>
      </div>
    `;
  });
}

function filterApplications() {
  const searchInput = document.getElementById("appSearchInput");
  const statusFilter = document.getElementById("appStatusFilter");

  if (!searchInput || !statusFilter) return;

  const query = searchInput.value.toLowerCase().trim();
  const selectedStatus = statusFilter.value;

  const filtered = allApplicationsList.filter(app => {
    const matchesSearch = !query ||
      (app.name && app.name.toLowerCase().includes(query)) ||
      (app.email && app.email.toLowerCase().includes(query)) ||
      (app.university && app.university.toLowerCase().includes(query)) ||
      (app.country && app.country.toLowerCase().includes(query)) ||
      (app.program && app.program.toLowerCase().includes(query));

    const matchesStatus = selectedStatus === "ALL" || (app.status || "Pending") === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  renderApplications(filtered);
}

// DOCUMENT PREVIEW MODAL FUNCTIONS
function openDocPreview(fileUrl, docTitle) {
  const modal = document.getElementById("docPreviewModal");
  const modalTitle = document.getElementById("docModalTitle");
  const modalBody = document.getElementById("docModalBody");
  const downloadBtn = document.getElementById("docModalDownloadBtn");
  const icon = document.getElementById("docModalIcon");

  if (!modal || !modalBody) return;

  modalTitle.innerText = docTitle || "Document Preview";
  downloadBtn.href = fileUrl;

  const isPdf = fileUrl.toLowerCase().includes(".pdf");
  const isImg = /\.(jpg|jpeg|png|webp|gif|svg)/i.test(fileUrl);

  if (isImg) {
    if (icon) icon.className = "fas fa-file-image";
    modalBody.innerHTML = `<img src="${fileUrl}" alt="Document Preview" />`;
  } else if (isPdf) {
    if (icon) icon.className = "fas fa-file-pdf";
    modalBody.innerHTML = `<iframe src="${fileUrl}" title="PDF Preview"></iframe>`;
  } else {
    if (icon) icon.className = "fas fa-file-alt";
    modalBody.innerHTML = `<iframe src="${fileUrl}" title="Document Preview"></iframe>`;
  }

  modal.classList.add("show");
}

function closeDocModal(e) {
  const modal = document.getElementById("docPreviewModal");
  if (modal) {
    modal.classList.remove("show");
    const modalBody = document.getElementById("docModalBody");
    if (modalBody) modalBody.innerHTML = "";
  }
}

async function updateApplicationStatus(id, newStatus) {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) return alert("Admin token required.");

    const res = await fetch(`${API_BASE_URL}/api/applications/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();
    if (res.ok) {
      const item = allApplicationsList.find(a => a._id === id);
      if (item) item.status = newStatus;
      filterApplications();
    } else {
      alert(data.message || "Failed to update status.");
    }
  } catch (err) {
    console.error("Update Status Error:", err);
    alert("Server error updating status.");
  }
}

async function deleteApplicationRecord(id) {
  if (!confirm("Are you sure you want to delete this application permanently?")) return;

  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) return alert("Admin token required.");

    const res = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    const data = await res.json();
    if (res.ok) {
      allApplicationsList = allApplicationsList.filter(a => a._id !== id);
      filterApplications();
    } else {
      alert(data.message || "Delete failed.");
    }
  } catch (err) {
    console.error("Delete Error:", err);
    alert("Server error deleting application.");
  }
}

// Initialize manage applications on page load
loadManageApplications();

// =========================================================
// CONTACT & CONSULTATION BOOKING ROUTE HANDLERS
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  // Contact Form Handler
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const origText = submitBtn ? submitBtn.innerText : "Send Message";

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      }

      const name = document.getElementById("contactName")?.value || contactForm.name?.value;
      const email = document.getElementById("contactEmail")?.value || contactForm.email?.value;
      const subject = document.getElementById("contactSubject")?.value || contactForm.subject?.value;
      const message = document.getElementById("contactMessage")?.value || contactForm.message?.value;

      try {
        const res = await fetch(`${API_BASE_URL}/api/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, subject, message })
        });
        const data = await res.json();
        if (res.ok) {
          alert("Thank you! Your message has been received successfully.");
          contactForm.reset();
        } else {
          alert(data.message || "Failed to send message.");
        }
      } catch (err) {
        console.error("Contact Form Error:", err);
        alert("Unable to connect to server. Please check backend connection.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = origText;
        }
      }
    });
  }

  // Consultation Booking Form Handler
  const bookingForm = document.getElementById("bookingForm");
  if (bookingForm) {
    bookingForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById("bookingSubmitBtn");
      const origText = submitBtn ? submitBtn.innerHTML : "Pay & Book Consultation";

      const name = document.getElementById("bookingName")?.value;
      const email = document.getElementById("bookingEmail")?.value;
      const phone = document.getElementById("bookingPhone")?.value;
      const topic = document.getElementById("bookingTopic")?.value;
      const date = document.getElementById("bookingDate")?.value;
      const time = document.getElementById("bookingTime")?.value;

      if (!name || !email || !phone || !topic || !date || !time) {
        alert("Please fill in all required booking details.");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Booking...';
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, topic, date, time })
        });
        const data = await res.json();
        if (res.ok) {
          alert("Consultation booked successfully! Our education advisor will reach out to you shortly.");
          bookingForm.reset();
        } else {
          alert(data.message || "Booking failed.");
        }
      } catch (err) {
        console.error("Booking Error:", err);
        alert("Unable to connect to server. Please try again later.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;
        }
      }
    });
  }
});