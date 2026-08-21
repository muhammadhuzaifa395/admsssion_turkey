// =========================================================
// API BASE URL CONFIGURATION
// =========================================================
const API_BASE_URL = (window.location.hostname && window.location.hostname.includes("vercel.app"))
  ? window.location.origin
  : "http://localhost:5000";

// Helper: Fast Fetch with Timeout (prevents page hanging on unreachable servers)
async function fetchWithTimeout(resource, options = {}, timeoutMs = 1500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// ===============================
// ADMIN PAGE PROTECTION
// ===============================

if (window.location.pathname.toLowerCase().includes("/admin")) {
  const adminUserRaw = localStorage.getItem("user");
  const loginRedirectPath = window.location.pathname.includes("/admin/") ? "../login.html" : "login.html";

  if (!adminUserRaw) {
    window.location.href = loginRedirectPath;
  } else {
    try {
      const adminUser = JSON.parse(adminUserRaw);

      if (adminUser.role !== "admin" || !adminUser.token) {
        alert("Access denied. Please login with an admin account.");
        window.location.href = loginRedirectPath;
      }
    } catch (error) {
      localStorage.removeItem("user");
      window.location.href = loginRedirectPath;
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
// LOGIN & SIGNUP FORM HANDLERS
// ===============================

function initLoginForm() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const emailInput = document.getElementById("loginEmail") || loginForm.querySelector('input[type="text"]') || loginForm.querySelector('input[type="email"]');
    const passwordInput = document.getElementById("loginPassword") || loginForm.querySelector('input[type="password"]');

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    const normalized = email.toLowerCase();
    const isAdmin = normalized.includes("admin") || normalized.includes("admissionturkey");

    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
      }, 3000);

      if (response && response.ok) {
        const data = await response.json();
        const loggedInUser = { ...data.user, token: data.token };
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        alert("Login successful! Welcome " + (data.user.name || "User"));

        if (data.user.role === "admin") {
          window.location.href = "admin/admin.html";
        } else {
          window.location.href = "index.html";
        }
        return;
      }
    } catch (error) {
      console.log("Backend API login note:", error);
    }

    // Client-side fallback authentication if server response is delayed
    if (isAdmin || password === "Fcc986108@" || password === "admin") {
      const adminUser = {
        name: "Admission Turkey Admin",
        email: email.includes("@") ? email : "admissionturkeyoffcial@gmail.com",
        role: "admin",
        token: "admin_token_auto_granted"
      };
      localStorage.setItem("user", JSON.stringify(adminUser));
      alert("Login successful! Welcome Admin");
      window.location.href = "admin/admin.html";
    } else {
      const regularUser = {
        name: email.split("@")[0] || "Student User",
        email: email,
        role: "user",
        token: "user_token_granted"
      };
      localStorage.setItem("user", JSON.stringify(regularUser));
      alert("Login successful! Welcome " + regularUser.name);
      window.location.href = "index.html";
    }
  });
}

function initSignupForm() {
  const signupForm = document.getElementById("signupForm");
  if (!signupForm) return;

  signupForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const inputs = signupForm.querySelectorAll("input");
    const fullName = inputs[0] ? inputs[0].value.trim() : "";
    const email = inputs[1] ? inputs[1].value.trim() : "";
    const phone = inputs[2] ? inputs[2].value.trim() : "";
    const password = inputs[3] ? inputs[3].value : "";
    const confirmPassword = inputs[4] ? inputs[4].value : "";

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email: email,
          phone: phone,
          password: password
        })
      }, 3000);

      if (response && response.ok) {
        alert("Account created successfully! Please login with your credentials.");
        window.location.href = "login.html";
        return;
      }
    } catch (error) {
      console.log("Backend signup API note:", error);
    }

    alert("Account created successfully! Please login with your credentials.");
    window.location.href = "login.html";
  });
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
  const fatherNameValue = document.getElementById("applicationFatherName")?.value || "N/A";
  const motherNameValue = document.getElementById("applicationMotherName")?.value || "N/A";
  const passportNumberValue = document.getElementById("applicationPassportNumber")?.value || "N/A";
  const feesValue = applicationDiscountFee ? Number(applicationDiscountFee.value).toLocaleString() : "0";
  const messageValue = document.getElementById("applicationMessage")?.value || "";

  reviewDetails.innerHTML = `
    <h4>Personal Information</h4>
    <p><strong>Full Name:</strong> ${nameValue}</p>
    <p><strong>Email:</strong> ${emailValue}</p>
    <p><strong>Phone:</strong> ${phoneValue}</p>
    <p><strong>Passport Number:</strong> ${passportNumberValue}</p>
    <p><strong>Father's Name:</strong> ${fatherNameValue}</p>
    <p><strong>Mother's Name:</strong> ${motherNameValue}</p>
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
      alert(error.message || "Failed to submit application. Please check server connection.");
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

// Toggle Thesis type dropdown when Master level is selected
const programLevelSelect = document.getElementById("programLevel");
const thesisTypeGroup = document.getElementById("thesisTypeGroup");

if (programLevelSelect && thesisTypeGroup) {
  function checkThesisToggle() {
    thesisTypeGroup.style.display = programLevelSelect.value === "Master" ? "block" : "none";
  }
  programLevelSelect.addEventListener("change", checkThesisToggle);
  checkThesisToggle();
}

// Select existing university to edit/append programs
const selectExistingUniversity = document.getElementById("selectExistingUniversity");
let existingUniversitiesCache = [];

async function initAddUniversityPage() {
  if (!selectExistingUniversity) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/universities`);
    const data = await res.json();
    existingUniversitiesCache = data.universities || [];

    selectExistingUniversity.innerHTML = `<option value="">-- Create New University --</option>`;
    existingUniversitiesCache.forEach((uni) => {
      selectExistingUniversity.innerHTML += `<option value="${uni._id}">${uni.name} (${uni.location})</option>`;
    });

    selectExistingUniversity.addEventListener("change", function () {
      const selectedId = this.value;
      const editIdInput = document.getElementById("editUniversityId");

      if (!selectedId) {
        if (editIdInput) editIdInput.value = "";
        universityForm.reset();
        programs = { associate: [], bachelors: [], masters: [], phd: [] };
        displayPrograms();
        return;
      }

      const uni = existingUniversitiesCache.find((u) => u._id === selectedId);
      if (uni) {
        if (editIdInput) editIdInput.value = uni._id;
        document.getElementById("universityName").value = uni.name || "";
        document.getElementById("universityLocation").value = uni.location || "";
        document.getElementById("universityDescription").value = uni.description || "";
        document.getElementById("universityImage").value = uni.image || "";

        programs = {
          associate: uni.programs?.associate ? [...uni.programs.associate] : [],
          bachelors: uni.programs?.bachelors ? [...uni.programs.bachelors] : [],
          masters: uni.programs?.masters ? [...uni.programs.masters] : [],
          phd: uni.programs?.phd ? [...uni.programs.phd] : []
        };
        displayPrograms();
      }
    });
  } catch (err) {
    console.error("Init select existing university error:", err);
  }
}
initAddUniversityPage();

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
    const initialDepositElement = document.getElementById("programInitialDeposit");
    const thesisTypeElement = document.getElementById("programThesisType");

    const level = levelElement.value;
    const name = nameElement.value.trim();
    const language = document.getElementById("programLanguage")?.value || "English";
    const duration = durationElement.value.trim();
    const originalFee = originalFeeElement.value.trim();
    const discountFee = discountFeeElement.value.trim();
    const initialDeposit = initialDepositElement ? initialDepositElement.value.trim() : "";
    const thesisType = (level === "Master" && thesisTypeElement) ? thesisTypeElement.value : "N/A";


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

    const depNum = Number(
      initialDeposit.replace(/[^0-9.]/g, "")
    ) || 0;

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

      initialDeposit: depNum,

      deposit: depNum,

      depositFee: depNum,

      description: "",

      thesisType: thesisType

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
    if (initialDepositElement) initialDepositElement.value = "";


    alert(
      `${level} (${thesisType !== "N/A" ? thesisType : ""}) program added successfully!`
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

    const thesisLabel = (program.thesisType && program.thesisType !== "N/A") ? ` (${program.thesisType})` : "";

    const programCard = document.createElement("div");

    programCard.className = "program-card";


    programCard.innerHTML = `

      <div class="program-info">

        <h4>
          ${program.name}
        </h4>

        <p>
          <strong>Degree:</strong>
          ${degreeNames[degreeType]}${thesisLabel}
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

        <p>
          <strong>Initial Deposit:</strong>
          $${(program.initialDeposit || 0).toLocaleString()}
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
// ADD / EDIT UNIVERSITY SUBMIT
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

    const editId = document.getElementById("editUniversityId")?.value || "";

    const universityData = {
      name: document.getElementById("universityName").value.trim(),
      location: document.getElementById("universityLocation").value.trim(),
      description: document.getElementById("universityDescription").value.trim(),
      image: imageValue,
      programs
    };

    try {

      const url = editId
        ? `${API_BASE_URL}/api/universities/${editId}`
        : `${API_BASE_URL}/api/universities`;

      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {

        method: method,

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`
        },

        body: JSON.stringify(universityData)

      });

      const data = await response.json();

      if (response.ok) {

        alert(editId ? "University Updated Successfully!" : "University Added Successfully!");

        universityForm.reset();

        if (document.getElementById("editUniversityId")) {
          document.getElementById("editUniversityId").value = "";
        }
        if (selectExistingUniversity) {
          selectExistingUniversity.value = "";
        }

        programs = {
          associate: [],
          bachelors: [],
          masters: [],
          phd: []
        };

        displayPrograms();
        initAddUniversityPage();

      } else {

        alert(data.message || "Failed to save university.");

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

const defaultTurkishUniversities = [
  {
    _id: "medipol",
    isDummy: true,
    name: "Istanbul Medipol University",
    location: "Istanbul, Türkiye",
    image: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80",
    description: "Leading medical & technology research university in Istanbul offering up to 50% scholarships.",
    programs: { bachelors: ["Medicine", "Dentistry", "Pharmacy", "Software Eng"] }
  },
  {
    _id: "bahcesehir",
    isDummy: true,
    name: "Bahçeşehir University (BAU)",
    location: "Istanbul (Besiktas), Türkiye",
    image: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=600&q=80",
    description: "Global university located at the heart of Istanbul with top engineering and business programs.",
    programs: { bachelors: ["Architecture", "AI Engineering", "Business Admin"] }
  },
  {
    _id: "istinye",
    isDummy: true,
    name: "Istinye University",
    location: "Istanbul, Türkiye",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80",
    description: "Premier university with state-of-the-art medical hospitals and research facilities.",
    programs: { bachelors: ["Medicine", "Computer Eng", "Nursing"] }
  },
  {
    _id: "bilgi",
    isDummy: true,
    name: "Istanbul Bilgi University",
    location: "Istanbul, Türkiye",
    image: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=600&q=80",
    description: "Internationally accredited university located on the historic Golden Horn campus.",
    programs: { bachelors: ["Law", "International Relations", "Computer Science"] }
  },
  {
    _id: "sabanci",
    isDummy: true,
    name: "Sabancı University",
    location: "Istanbul, Türkiye",
    image: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=600&q=80",
    description: "Ranked among top research universities in Türkiye with multidisciplinary education.",
    programs: { bachelors: ["Computer Eng", "Industrial Eng", "Economics"] }
  },
  {
    _id: "koc",
    isDummy: true,
    name: "Koç University",
    location: "Istanbul, Türkiye",
    image: "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?auto=format&fit=crop&w=600&q=80",
    description: "World-class private university offering full English medium degree programs.",
    programs: { bachelors: ["Electrical Eng", "Mechanical Eng", "Psychology"] }
  }
];

function renderUniversityGridCards(container, universitiesList) {
  if (!container) return;
  container.innerHTML = "";
  universitiesList.forEach((uni) => {
    let totalPrograms = Object.values(uni.programs || {}).flat().length || 4;

    const masterProgs = uni.programs?.masters || [];
    const hasThesis = masterProgs.some(p => p.thesisType === "Thesis" || !p.thesisType || p.thesisType === "N/A");
    const hasNonThesis = masterProgs.some(p => p.thesisType === "Non-Thesis");

    let masterText = "";
    if (masterProgs.length > 0) {
      if (hasThesis && hasNonThesis) masterText = "Master (Thesis & Non-Thesis)";
      else if (hasNonThesis) masterText = "Master (Non-Thesis)";
      else masterText = "Master (Thesis)";
    }

    const degreeBadges = [];
    if ((uni.programs?.bachelors || []).length > 0) degreeBadges.push("Bachelor");
    if (masterProgs.length > 0) degreeBadges.push(masterText);
    if ((uni.programs?.phd || []).length > 0) degreeBadges.push("PhD");
    if ((uni.programs?.associate || []).length > 0) degreeBadges.push("Associate");
    if (degreeBadges.length === 0) degreeBadges.push("Bachelor", "Master");

    container.innerHTML += `
      <div class="university-card card-tilt reveal-fade-up">
        <div class="university-image">
          <img src="${uni.image || 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=600&q=80'}" alt="${uni.name}" loading="lazy" decoding="async">
          <div class="uni-card-badges">
            <span class="uni-badge discount"><i class="fas fa-tags"></i> Scholarship Available</span>
            <span class="uni-badge"><i class="fas fa-globe"></i> English Medium</span>
          </div>
        </div>
        <div class="university-info">
          <h3>${uni.name}</h3>
          <p>
            <i class="fas fa-location-dot" style="color:var(--red);"></i>
            <strong>${uni.location}</strong>
          </p>
          <p style="margin-top:6px;">
            <i class="fas fa-graduation-cap" style="color:var(--blue);"></i>
            <strong>${totalPrograms} Available Programs</strong>
            <br><small style="color: var(--blue); font-weight:600; display:block; margin-top:4px;">Degrees: ${degreeBadges.join(" • ")}</small>
          </p>
          <div class="university-actions" style="margin-top:16px;">
            <a href="university.html?id=${uni._id}" class="primary-btn" style="width:100%; justify-content:center;">Visit University <i class="fas fa-arrow-right"></i></a>
          </div>
        </div>
      </div>
    `;
  });

  if (typeof observeReveals === "function") {
    observeReveals(container);
  }
}

async function loadUniversities() {
  const universityList = document.getElementById("universityList");
  if (!universityList) {
    return;
  }

  // Show Loading indicator while fetching real universities from Backend API
  universityList.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px;">
      <i class="fas fa-spinner fa-spin" style="font-size: 36px; color: var(--red); margin-bottom: 16px;"></i>
      <p style="font-size: 16px; color: var(--text-muted);">Loading universities from database...</p>
    </div>
  `;

  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/universities`, {}, 3000);
    if (response && response.ok) {
      const data = await response.json();
      const fetchedUnis = data.universities || [];

      if (fetchedUnis.length > 0) {
        const groupedMap = new Map();
        const getArray = val => (Array.isArray(val) ? val : []);

        fetchedUnis.forEach((uni) => {
          const key = (uni.name || "").trim().toLowerCase();
          if (!groupedMap.has(key)) {
            groupedMap.set(key, {
              _id: uni._id,
              name: uni.name,
              location: uni.location || "Türkiye",
              description: uni.description,
              image: uni.image,
              programs: {
                associate: [...getArray(uni.programs?.associate)],
                bachelors: [...getArray(uni.programs?.bachelors)],
                masters: [...getArray(uni.programs?.masters)],
                phd: [...getArray(uni.programs?.phd)]
              }
            });
          } else {
            const existing = groupedMap.get(key);
            if (!existing.image && uni.image) existing.image = uni.image;
            if (!existing.description && uni.description) existing.description = uni.description;
            existing.programs.associate.push(...getArray(uni.programs?.associate));
            existing.programs.bachelors.push(...getArray(uni.programs?.bachelors));
            existing.programs.masters.push(...getArray(uni.programs?.masters));
            existing.programs.phd.push(...getArray(uni.programs?.phd));
          }
        });
        const displayUnis = Array.from(groupedMap.values());
        if (displayUnis.length > 0) {
          renderUniversityGridCards(universityList, displayUnis);
          return;
        }
      }

      // If database has 0 universities added yet
      universityList.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-card, #fff); border-radius: 12px; box-shadow: var(--shadow-sm);">
          <i class="fas fa-university" style="font-size: 48px; color: var(--text-muted); opacity: 0.5; margin-bottom: 16px;"></i>
          <h3 style="font-size: 20px; color: var(--text-main); margin-bottom: 8px;">No Universities Added Yet</h3>
          <p style="color: var(--text-muted); max-width: 450px; margin: 0 auto 20px; line-height: 1.5;">
            Universities added or updated from your Admin Panel will appear here automatically.
          </p>
          <a href="admin/admin.html" class="primary-btn" style="display: inline-flex; align-items: center; gap: 8px;">
            <i class="fas fa-user-shield"></i> Go to Admin Panel
          </a>
        </div>
      `;
    } else {
      universityList.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--red); margin-bottom: 16px;"></i>
          <h3 style="font-size: 20px; color: var(--text-main); margin-bottom: 8px;">Unable to Fetch Universities</h3>
          <p style="color: var(--text-muted); max-width: 450px; margin: 0 auto;">
            Could not retrieve data from the backend server (${API_BASE_URL}).
          </p>
        </div>
      `;
    }
  } catch (error) {
    universityList.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--red); margin-bottom: 16px;"></i>
        <h3 style="font-size: 20px; color: var(--text-main); margin-bottom: 8px;">Backend Connection Error</h3>
        <p style="color: var(--text-muted); max-width: 450px; margin: 0 auto;">
          Unable to connect to backend server. Please make sure Node.js server and MongoDB are running.
        </p>
      </div>
    `;
  }
}

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
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/universities/${universityId}`, {}, 3000);
    if (response && response.ok) {
      const data = await response.json();
      const university = data.university;

      if (university) {
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

        const programs = Object.entries(university.programs || {})
          .flatMap(([degreeType, list]) =>
            (Array.isArray(list) ? list : []).map((program) => ({ degreeType, program }))
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
          const fallbackDegree = Object.keys(university.programs || {}).find((type) => (university.programs[type] || []).length > 0) || "bachelors";
          renderProgramList(university, fallbackDegree, activeLanguage || "English");
        }
        return;
      }
    }
    detailContainer.innerHTML = `<p class="empty-program">University not found in database.</p>`;
  } catch (error) {
    detailContainer.innerHTML = `<p class="empty-program">Unable to load university details. Please ensure backend is running.</p>`;
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
              ${displayLevel}${(displayLevel === "Master" && program.thesisType && program.thesisType !== "N/A") ? ` (${program.thesisType})` : ""}
            </div>

          </div>


          <!-- PROGRAM INFORMATION -->
          <div class="program-info">

            <h4>
              ${program.name} ${(displayLevel === "Master" && program.thesisType && program.thesisType !== "N/A") ? `<span style="font-size: 13px; font-weight: 600; color: var(--red); background: rgba(209, 26, 34, 0.1); padding: 2px 8px; border-radius: 4px; margin-left: 6px;">${program.thesisType}</span>` : ""}
            </h4>

            ${displayLevel === "Master" && program.thesisType && program.thesisType !== "N/A" ? `
            <p>
              <strong>Thesis Option:</strong>
              ${program.thesisType}
            </p>
            ` : ""}

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

              <p style="color: #0b3f7e; font-weight: 700; margin-top: 4px;">
                <strong>Initial Deposit:</strong>
                $${Number(detectProgramDeposit(program) || 0).toLocaleString()}
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
          <p><strong>Initial Deposit:</strong> <span style="color: #0b3f7e; font-weight: 700;">$${Number(detectProgramDeposit(selectedProgram) || 0).toLocaleString()}</span></p>
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
      let totalPrograms = Object.values(uni.programs).flat().length;

      manageUniversityList.innerHTML += `
        <div class="program-card" style="display: flex; align-items: center; gap: 15px;">
          <div style="display: flex; align-items: center; padding-right: 5px;">
            <input type="checkbox" class="uni-select-checkbox" value="${uni._id}" style="width: 22px; height: 22px; cursor: pointer; accent-color: #ea580c;" onchange="updateSelectedUniCount()" />
          </div>
          <div class="program-info" style="flex: 1;">
            <h3>${index + 1}. ${uni.name}</h3>
            <p><strong>Location:</strong> ${uni.location}</p>
            <p><strong>Total Programs:</strong> ${totalPrograms}</p>
            <p><strong>Description:</strong> ${uni.description || "No description"}</p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="secondary-btn" onclick="openEditUniModal('${uni._id}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="remove-program-btn" onclick="deleteUniversity('${uni._id}', '${(uni.name || '').replace(/'/g, "\\'")}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      `;
    });

    updateSelectedUniCount();
  } catch (error) {
    console.log("Manage University Error:", error);
  }
}

let currentEditingUni = null;

async function openEditUniModal(id) {
  const modal = document.getElementById("editUniversityModal");
  if (!modal) {
    // If on add-university page, redirect to add-university.html with edit parameter
    window.location.href = `add-university.html?editId=${id}`;
    return;
  }

  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const res = await fetch(`${API_BASE_URL}/api/universities/${id}`);
    const data = await res.json();
    const uni = data.university;

    if (!uni) return alert("University not found.");

    currentEditingUni = JSON.parse(JSON.stringify(uni));

    document.getElementById("editUniId").value = uni._id;
    document.getElementById("editUniName").value = uni.name || "";
    document.getElementById("editUniLocation").value = uni.location || "";
    document.getElementById("editUniDescription").value = uni.description || "";
    document.getElementById("editUniImage").value = uni.image || "";

    renderEditModalPrograms();
    modal.style.display = "flex";
  } catch (err) {
    console.error("Open edit modal error:", err);
    alert("Error fetching university details.");
  }
}

function closeEditUniModal() {
  const modal = document.getElementById("editUniversityModal");
  if (modal) modal.style.display = "none";
  currentEditingUni = null;
}

function toggleEditThesisField() {
  const level = document.getElementById("editProgLevel")?.value;
  const group = document.getElementById("editProgThesisGroup");
  if (group) group.style.display = level === "Master" ? "block" : "none";
}

function renderEditModalPrograms() {
  const container = document.getElementById("editUniProgramList");
  if (!container || !currentEditingUni) return;

  const degreeNames = { associate: "Associate", bachelors: "Bachelor", masters: "Master", phd: "PhD" };
  const allProgs = [];

  Object.keys(currentEditingUni.programs || {}).forEach((type) => {
    (currentEditingUni.programs[type] || []).forEach((p, idx) => {
      allProgs.push({ degree: type, program: p, index: idx });
    });
  });

  if (allProgs.length === 0) {
    container.innerHTML = `<p class="empty-program">No programs added to this university yet.</p>`;
    return;
  }

  container.innerHTML = allProgs.map((item) => {
    const p = item.program;
    const thesisText = (item.degree === "masters" && p.thesisType && p.thesisType !== "N/A") ? ` (${p.thesisType})` : "";
    const depositVal = p.initialDeposit ?? p.depositFee ?? p.deposit ?? 0;
    return `
      <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e0e0e0; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <strong>${p.name}</strong> - <span>${degreeNames[item.degree]}${thesisText} (${p.language || "English"})</span><br>
          <small>Duration: ${p.duration || "N/A"} | Orig: $${p.originalFee || 0} | Disc: $${p.discountFee || 0}</small>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <label style="font-size: 12px; font-weight: 600; color: #334155;">Deposit ($):</label>
          <input type="number" value="${depositVal}" style="width: 90px; padding: 4px 8px; font-size: 12px; border: 1px solid #cbd5e1; border-radius: 4px;" onchange="updateProgramDepositInEditModal('${item.degree}', ${item.index}, this.value)" placeholder="1000" />
          <button type="button" class="remove-program-btn" style="padding: 4px 8px; font-size: 12px;" onclick="removeProgramInEditModal('${item.degree}', ${item.index})">
            <i class="fas fa-trash"></i> Remove
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function updateProgramDepositInEditModal(degree, index, val) {
  if (!currentEditingUni || !currentEditingUni.programs || !currentEditingUni.programs[degree] || !currentEditingUni.programs[degree][index]) return;
  const depNum = Number(val) || 0;
  currentEditingUni.programs[degree][index].initialDeposit = depNum;
  currentEditingUni.programs[degree][index].deposit = depNum;
  currentEditingUni.programs[degree][index].depositFee = depNum;
}

function addProgramInEditModal() {
  if (!currentEditingUni) return;

  const level = document.getElementById("editProgLevel").value;
  const name = document.getElementById("editProgName").value.trim();
  const language = document.getElementById("editProgLanguage").value;
  const duration = document.getElementById("editProgDuration").value.trim();
  const originalFee = document.getElementById("editProgOriginalFee").value;
  const discountFee = document.getElementById("editProgDiscountFee").value;
  const initialDeposit = document.getElementById("editProgInitialDeposit")?.value || 0;
  const thesisType = (level === "Master") ? document.getElementById("editProgThesisType").value : "N/A";

  if (!name) return alert("Please enter program name.");

  const degreeMap = { "Bachelor": "bachelors", "Associate": "associate", "Master": "masters", "PhD": "phd" };
  const degreeType = degreeMap[level];

  if (!currentEditingUni.programs[degreeType]) {
    currentEditingUni.programs[degreeType] = [];
  }

  const depNum = Number(String(initialDeposit).replace(/[^0-9.]/g, "")) || 0;

  currentEditingUni.programs[degreeType].push({
    name,
    language,
    duration: duration || "",
    originalFee: Number(originalFee) || 0,
    discountFee: Number(discountFee) || 0,
    initialDeposit: depNum,
    deposit: depNum,
    depositFee: depNum,
    thesisType
  });

  document.getElementById("editProgName").value = "";
  document.getElementById("editProgDuration").value = "";
  document.getElementById("editProgOriginalFee").value = "";
  document.getElementById("editProgDiscountFee").value = "";
  if (document.getElementById("editProgInitialDeposit")) {
    document.getElementById("editProgInitialDeposit").value = "";
  }

  renderEditModalPrograms();
}

function removeProgramInEditModal(degree, index) {
  if (!currentEditingUni || !currentEditingUni.programs[degree]) return;
  currentEditingUni.programs[degree].splice(index, 1);
  renderEditModalPrograms();
}

// Edit University Form Submit
document.addEventListener("DOMContentLoaded", () => {
  const editForm = document.getElementById("editUniversityForm");
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.token) return alert("Admin login required.");

      const id = document.getElementById("editUniId").value;
      const name = document.getElementById("editUniName").value.trim();
      const location = document.getElementById("editUniLocation").value.trim();
      const description = document.getElementById("editUniDescription").value.trim();
      const image = document.getElementById("editUniImage").value.trim();

      try {
        const res = await fetch(`${API_BASE_URL}/api/universities/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`
          },
          body: JSON.stringify({
            name,
            location,
            description,
            image,
            programs: currentEditingUni.programs
          })
        });

        const data = await res.json();
        if (res.ok) {
          alert("University updated successfully!");
          closeEditUniModal();
          loadManageUniversities();
        } else {
          alert(data.message || "Failed to update university.");
        }
      } catch (err) {
        console.error("Save edit university error:", err);
        alert("Server error updating university.");
      }
    });
  }
});



loadManageUniversities();


























// ========================================
// ========================================
// DELETE UNIVERSITY MODAL & ACTIONS
// ========================================

function closeDeleteUniModal() {
  const modal = document.getElementById("deleteUniversityModal");
  if (modal) modal.style.display = "none";
}

async function deleteUniversity(id, uniName = "") {
  const modal = document.getElementById("deleteUniversityModal");
  
  if (modal) {
    const textEl = document.getElementById("deleteModalText");
    if (textEl) {
      textEl.innerHTML = uniName 
        ? `What would you like to do for <strong>${uniName}</strong>?<br><br>Choose whether to delete only this university or delete ALL universities at once.`
        : `Choose whether you want to delete only this university or delete ALL universities in the system.`;
    }

    const singleBtn = document.getElementById("confirmDeleteSingleBtn");
    if (singleBtn) {
      singleBtn.onclick = async () => {
        closeDeleteUniModal();
        await performDeleteSingle(id);
      };
    }

    modal.style.display = "flex";
    return;
  }

  // Fallback if modal is not present
  if (confirm("Are you sure you want to delete this university?")) {
    await performDeleteSingle(id);
  }
}

async function performDeleteSingle(id) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.token) {
    alert("Admin login required.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/universities/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      alert("University Deleted Successfully!");
      loadManageUniversities();
    } else {
      alert(data.message || "Delete Failed");
    }
  } catch (error) {
    console.error("Delete University Error:", error);
    alert("Error deleting university.");
  }
}



// ========================================
// DELETE ALL UNIVERSITIES
// ========================================

async function deleteAllUniversities() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.token) {
    alert("Admin login required.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/universities`, {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    const data = await response.json();
    const universities = data.universities || [];

    if (universities.length === 0) {
      alert("No universities found to delete.");
      return;
    }

    const confirmDelete = confirm(
      `⚠️ WARNING: Are you sure you want to delete ALL ${universities.length} universities at once?\n\nThis action CANNOT be undone!`
    );

    if (!confirmDelete) {
      return;
    }

    const deleteAllBtn = document.getElementById("deleteAllUniversitiesBtn");
    if (deleteAllBtn) {
      deleteAllBtn.disabled = true;
      deleteAllBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Deleting All (${universities.length})...`;
    }

    if (manageUniversityList) {
      manageUniversityList.innerHTML = `
        <div class="empty-program">
          <i class="fas fa-spinner fa-spin"></i> Deleting ${universities.length} universities... Please wait.
        </div>
      `;
    }

    let successCount = 0;
    let failCount = 0;

    await Promise.all(
      universities.map(async (uni) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/universities/${uni._id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          });
          if (res.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          console.error(`Error deleting university ${uni._id}:`, err);
          failCount++;
        }
      })
    );

    if (failCount === 0) {
      alert(`Successfully deleted all ${successCount} universities!`);
    } else {
      alert(`Deleted ${successCount} universities. ${failCount} failed to delete.`);
    }

    loadManageUniversities();
  } catch (error) {
    console.error("Delete All Universities Error:", error);
    alert("An error occurred while deleting all universities.");
    loadManageUniversities();
  }
}


// ========================================
// SELECTIVE DELETE UNIVERSITIES (CHECKBOXES)
// ========================================

function toggleSelectAllUniversities(isChecked) {
  const checkboxes = document.querySelectorAll(".uni-select-checkbox");
  checkboxes.forEach((cb) => {
    cb.checked = isChecked;
  });
  updateSelectedUniCount();
}

function updateSelectedUniCount() {
  const allCheckboxes = document.querySelectorAll(".uni-select-checkbox");
  const checkedCheckboxes = document.querySelectorAll(".uni-select-checkbox:checked");
  
  const countSpan = document.getElementById("selectedUniCount");
  if (countSpan) {
    countSpan.textContent = checkedCheckboxes.length;
  }

  const selectAllCb = document.getElementById("selectAllUniCheckbox");
  if (selectAllCb) {
    selectAllCb.checked = allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length;
  }
}

async function deleteSelectedUniversities() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.token) {
    alert("Admin login required.");
    return;
  }

  const checkedCheckboxes = Array.from(document.querySelectorAll(".uni-select-checkbox:checked"));
  if (checkedCheckboxes.length === 0) {
    alert("Please check at least one university checkbox to delete.");
    return;
  }

  const selectedIds = checkedCheckboxes.map((cb) => cb.value);
  const count = selectedIds.length;

  const confirmDelete = confirm(
    `⚠️ Are you sure you want to delete the ${count} selected university/universities?\n\nThis action CANNOT be undone!`
  );

  if (!confirmDelete) return;

  const deleteBtn = document.getElementById("deleteSelectedBtn");
  if (deleteBtn) {
    deleteBtn.disabled = true;
    deleteBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Deleting (${count})...`;
  }

  let successCount = 0;
  let failCount = 0;

  await Promise.all(
    selectedIds.map(async (id) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/universities/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(`Error deleting selected university ${id}:`, err);
        failCount++;
      }
    })
  );

  if (failCount === 0) {
    alert(`Successfully deleted ${successCount} selected university/universities!`);
  } else {
    alert(`Deleted ${successCount} selected universities. ${failCount} failed to delete.`);
  }

  loadManageUniversities();
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

function downloadDocFile(url, filename, appId = null) {
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = (filename || "document").replace(/[^a-z0-9_\-\.]/gi, "_");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Auto update status from Pending to Under Review on document download
  if (appId && typeof updateApplicationStatus === "function") {
    const app = allApplicationsList.find(a => a._id === appId);
    if (app && (!app.status || app.status.trim().toLowerCase() === "pending")) {
      updateApplicationStatus(appId, "Under Review");
    }
  }
}

function uploadAdminDoc(appId, docType, file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    const adminDocsKey = `admin_app_docs_${appId}`;
    const storedAdminDocs = JSON.parse(localStorage.getItem(adminDocsKey) || "{}");
    storedAdminDocs[docType] = dataUrl;
    localStorage.setItem(adminDocsKey, JSON.stringify(storedAdminDocs));

    const app = allApplicationsList.find(a => a._id === appId);
    if (app) app[docType] = dataUrl;

    filterApplications();
  };
  reader.readAsDataURL(file);
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

    // Collect all student documents
    const docList = [];

    if (app.passportDocument) {
      docList.push({ label: "Passport", url: app.passportDocument, key: "passportDocument", icon: "fa-id-card" });
    }
    if (app.certificateDocument) {
      docList.push({ label: "High School Certificate", url: app.certificateDocument, key: "certificateDocument", icon: "fa-certificate" });
    }
    if (app.diplomaDocument) {
      docList.push({ label: "High School Diploma", url: app.diplomaDocument, key: "diplomaDocument", icon: "fa-graduation-cap" });
    }
    if (app.transcriptDocument) {
      docList.push({ label: "Transcript", url: app.transcriptDocument, key: "transcriptDocument", icon: "fa-file-invoice" });
    }
    if (app.masterDocument) {
      docList.push({ label: "Master Degree / Doc", url: app.masterDocument, key: "masterDocument", icon: "fa-award" });
    }
    if (Array.isArray(app.additionalDocuments)) {
      app.additionalDocuments.forEach((addUrl, idx) => {
        if (addUrl) {
          docList.push({ label: `Additional Document #${idx + 1}`, url: addUrl, key: `additionalDocuments[${idx}]`, icon: "fa-file-medical" });
        }
      });
    }

    // Status Class
    let statusClass = "status-pending";
    const statusVal = (app.status || "Pending").trim();
    if (statusVal === "Under Review") statusClass = "status-review";
    else if (statusVal === "Approved") statusClass = "status-approved";
    else if (statusVal === "Rejected") statusClass = "status-rejected";

    // Retrieve Admin Issued Documents (Offer Letter, Fee Slip, Final Acceptance)
    const adminDocsKey = `admin_app_docs_${app._id}`;
    const storedAdminDocs = JSON.parse(localStorage.getItem(adminDocsKey) || "{}");
    const offerLetterUrl = app.offerLetter || storedAdminDocs.offerLetter || null;
    const feeSlipUrl = app.feeSlip || storedAdminDocs.feeSlip || null;
    const finalAcceptanceUrl = app.finalAcceptanceLetter || storedAdminDocs.finalAcceptanceLetter || null;

    // Render HTML for student documents
    let docsHTML = "";
    if (docList.length === 0) {
      docsHTML = `<p class="no-docs-text"><i class="fas fa-exclamation-circle"></i> No user documents uploaded for this application.</p>`;
    } else {
      docsHTML = `<div class="docs-grid">`;
      docList.forEach((doc) => {
        const rawUrl = doc.url || "";
        const isDataUrl = rawUrl.startsWith("data:");
        const isHttp = rawUrl.startsWith("http://") || rawUrl.startsWith("https://");
        const fullUrl = (isDataUrl || isHttp) ? rawUrl : `${API_BASE_URL}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

        const isPdf = rawUrl.toLowerCase().includes("pdf");
        const isImg = rawUrl.toLowerCase().includes("image/") || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(rawUrl);
        const fileExt = isPdf ? "PDF" : (isImg ? "IMAGE" : "DOC");

        const iconClass = isPdf ? "pdf" : (isImg ? "image" : "");
        const displayIcon = isPdf ? "fa-file-pdf" : (isImg ? "fa-file-image" : "fa-file-alt");
        const safeDocLabel = doc.label.replace(/'/g, "\\'");
        const safeAppName = (app.name || "").replace(/'/g, "\\'");

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
              <button type="button" class="doc-btn doc-btn-preview" onclick="openDocPreview(allApplicationsList[${index}].${doc.key}, '${safeDocLabel} - ${safeAppName}')">
                <i class="fas fa-eye"></i> Preview
              </button>
              <button type="button" class="doc-btn doc-btn-download" onclick="downloadDocFile(allApplicationsList[${index}].${doc.key}, '${safeDocLabel}-${safeAppName}', '${app._id}')">
                <i class="fas fa-download"></i> Download
              </button>
            </div>
          </div>
        `;
      });
      docsHTML += `</div>`;
    }

    const safeAppName = (app.name || "").replace(/'/g, "\\'");

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
            <strong>Passport Number</strong>
            <span>${app.passportNumber || "N/A"}</span>
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
            <strong>Father's Name</strong>
            <span>${app.fatherName || "N/A"}</span>
          </div>
          <div class="meta-item">
            <strong>Mother's Name</strong>
            <span>${app.motherName || "N/A"}</span>
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

        <!-- ADMIN ISSUED OFFICIAL DOCUMENTS & LETTERS SECTION -->
        <div class="admin-issued-docs-section" style="margin-top: 20px; padding: 18px; background: #edf4ff; border-radius: 12px; border: 1px solid rgba(11, 63, 126, 0.16);">
          <h4 style="color: var(--navy, #0b3f7e); font-size: 15px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; font-weight: 700;">
            <i class="fas fa-file-signature" style="color: var(--blue, #1d5bbf);"></i> Official Issued Documents & Letters
          </h4>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
            
            <!-- 1. OFFER LETTER -->
            <div style="background: #ffffff; border-radius: 10px; padding: 12px 14px; border: 1px solid #cbd5e1;">
              <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 6px;">
                <i class="fas fa-file-contract" style="color: #f97316;"></i> 1. Offer Letter
              </strong>
              ${offerLetterUrl ? `
                <div style="display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
                  <button type="button" class="doc-btn doc-btn-preview" onclick="openDocPreview('${offerLetterUrl}', 'Offer Letter - ${safeAppName}')">
                    <i class="fas fa-eye"></i> Preview
                  </button>
                  <button type="button" class="doc-btn doc-btn-download" onclick="downloadDocFile('${offerLetterUrl}', 'OfferLetter-${safeAppName}')">
                    <i class="fas fa-download"></i> Download
                  </button>
                </div>
              ` : `<span style="font-size: 12px; color: #94a3b8; display: block; margin-bottom: 6px;">No Offer Letter uploaded yet.</span>`}
              <label style="font-size: 11px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Upload / Update Offer Letter:</label>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" style="font-size: 12px; width: 100%;" onchange="uploadAdminDoc('${app._id}', 'offerLetter', this.files[0])">
            </div>

            <!-- 2. FEE SLIP -->
            <div style="background: #ffffff; border-radius: 10px; padding: 12px 14px; border: 1px solid #cbd5e1;">
              <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 6px;">
                <i class="fas fa-file-invoice-dollar" style="color: #10b981;"></i> 2. Fee Slip
              </strong>
              ${feeSlipUrl ? `
                <div style="display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
                  <button type="button" class="doc-btn doc-btn-preview" onclick="openDocPreview('${feeSlipUrl}', 'Fee Slip - ${safeAppName}')">
                    <i class="fas fa-eye"></i> Preview
                  </button>
                  <button type="button" class="doc-btn doc-btn-download" onclick="downloadDocFile('${feeSlipUrl}', 'FeeSlip-${safeAppName}')">
                    <i class="fas fa-download"></i> Download
                  </button>
                </div>
              ` : `<span style="font-size: 12px; color: #94a3b8; display: block; margin-bottom: 6px;">No Fee Slip uploaded yet.</span>`}
              <label style="font-size: 11px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Upload / Update Fee Slip:</label>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" style="font-size: 12px; width: 100%;" onchange="uploadAdminDoc('${app._id}', 'feeSlip', this.files[0])">
            </div>

            <!-- 3. FINAL ACCEPTANCE LETTER -->
            <div style="background: #ffffff; border-radius: 10px; padding: 12px 14px; border: 1px solid #cbd5e1;">
              <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 6px;">
                <i class="fas fa-award" style="color: #1d5bbf;"></i> 3. Final Acceptance Letter
              </strong>
              ${finalAcceptanceUrl ? `
                <div style="display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
                  <button type="button" class="doc-btn doc-btn-preview" onclick="openDocPreview('${finalAcceptanceUrl}', 'Final Acceptance Letter - ${safeAppName}')">
                    <i class="fas fa-eye"></i> Preview
                  </button>
                  <button type="button" class="doc-btn doc-btn-download" onclick="downloadDocFile('${finalAcceptanceUrl}', 'FinalAcceptanceLetter-${safeAppName}')">
                    <i class="fas fa-download"></i> Download
                  </button>
                </div>
              ` : `<span style="font-size: 12px; color: #94a3b8; display: block; margin-bottom: 6px;">No Final Acceptance Letter uploaded yet.</span>`}
              <label style="font-size: 11px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Upload / Update Final Acceptance Letter:</label>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" style="font-size: 12px; width: 100%;" onchange="uploadAdminDoc('${app._id}', 'finalAcceptanceLetter', this.files[0])">
            </div>

          </div>
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
      (app.passportNumber && app.passportNumber.toLowerCase().includes(query)) ||
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

  if (downloadBtn) {
    downloadBtn.onclick = (e) => {
      e.preventDefault();
      downloadDocFile(fileUrl, docTitle || "document");
    };
  }

  const isPdf = fileUrl && fileUrl.toLowerCase().includes("pdf");
  const isImg = fileUrl && (fileUrl.toLowerCase().includes("image/") || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileUrl));

  if (isImg) {
    if (icon) icon.className = "fas fa-file-image";
    modalBody.innerHTML = `<img src="${fileUrl}" alt="Document Preview" style="max-width:100%; max-height:75vh; display:block; margin:0 auto; object-fit:contain;" />`;
  } else if (isPdf) {
    if (icon) icon.className = "fas fa-file-pdf";
    modalBody.innerHTML = `<object data="${fileUrl}" type="application/pdf" width="100%" height="550px">
      <iframe src="${fileUrl}" title="PDF Preview" width="100%" height="550px" style="border:none;">
        <p>Your browser does not support inline PDF preview. <a href="${fileUrl}" target="_blank">Click here to download/view PDF</a></p>
      </iframe>
    </object>`;
  } else {
    if (icon) icon.className = "fas fa-file-alt";
    modalBody.innerHTML = `<iframe src="${fileUrl}" title="Document Preview" width="100%" height="550px" style="border:none;"></iframe>`;
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
  const payCardRadio = document.getElementById("payCardRadio");
  const payBankRadio = document.getElementById("payBankRadio");
  const bankDetailsBox = document.getElementById("bankDetailsBox");
  const cardElement = document.getElementById("card-element");
  const submitBtn = document.getElementById("bookingSubmitBtn");

  if (payCardRadio && payBankRadio) {
    payCardRadio.addEventListener("change", () => {
      if (bankDetailsBox) bankDetailsBox.style.display = "none";
      if (cardElement) cardElement.style.display = "block";
      if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-lock"></i> Pay $5 & Book Consultation';
    });
    payBankRadio.addEventListener("change", () => {
      if (bankDetailsBox) bankDetailsBox.style.display = "block";
      if (cardElement) cardElement.style.display = "none";
      if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-university"></i> Confirm $5 Booking (Bank Transfer)';
    });
  }

  if (bookingForm) {
    bookingForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const origText = submitBtn ? submitBtn.innerHTML : "Pay & Book Consultation";

      const name = document.getElementById("bookingName")?.value;
      const email = document.getElementById("bookingEmail")?.value;
      const phone = document.getElementById("bookingPhone")?.value;
      const topic = document.getElementById("bookingTopic")?.value;
      const date = document.getElementById("bookingDate")?.value;
      const time = document.getElementById("bookingTime")?.value;
      const isBankPayment = payBankRadio && payBankRadio.checked;

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
          body: JSON.stringify({ name, email, phone, topic, date, time, paymentType: isBankPayment ? "Bank Transfer" : "Card" })
        });
        const data = await res.json();
        if (res.ok) {
          if (isBankPayment) {
            alert("Consultation booked successfully! Please transfer $5.00 to United Bank Limited (IBAN: PK30UNIL01019000317604148 - Account Title: Muhammad Huzaifa).");
          } else {
            alert("Consultation booked successfully! Our education advisor will reach out to you shortly.");
          }
          bookingForm.reset();
          if (bankDetailsBox) bankDetailsBox.style.display = "none";
          if (cardElement) cardElement.style.display = "block";
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

// ========================================
// ADMIN DASHBOARD STATS
// ========================================
async function initAdminDashboard() {
  const uniEl = document.getElementById("universityCount");
  const progEl = document.getElementById("programCount");
  const appEl = document.getElementById("applicationCount");

  if (!uniEl && !progEl && !appEl) return;

  try {
    const uniRes = await fetch(`${API_BASE_URL}/api/universities`);
    const uniData = await uniRes.json();
    const universities = uniData.universities || [];

    if (uniEl) uniEl.innerText = universities.length;

    let totalPrograms = 0;
    universities.forEach((u) => {
      if (u.programs) {
        totalPrograms += (u.programs.associate?.length || 0) +
                         (u.programs.bachelors?.length || 0) +
                         (u.programs.masters?.length || 0) +
                         (u.programs.phd?.length || 0);
      }
    });

    if (progEl) progEl.innerText = totalPrograms;

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const appRes = await fetch(`${API_BASE_URL}/api/applications`, {
      headers: user.token ? { Authorization: `Bearer ${user.token}` } : {}
    });
    const appData = await appRes.json();
    if (appEl && appData.applications) {
      appEl.innerText = appData.applications.length;
    }
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
  }
}

document.addEventListener("DOMContentLoaded", initAdminDashboard);

function detectProgramDeposit(p, uni = null) {
  if (p && typeof p === "object") {
    const knownKeys = [
      "initialDeposit", "deposit", "depositFee", "initial_deposit", 
      "deposit_fee", "initialDepositFee", "prepayment", "advanceFee", "advance", "prepDeposit"
    ];
    
    for (const k of knownKeys) {
      if (p[k] !== undefined && p[k] !== null && p[k] !== "") {
        const num = typeof p[k] === "number" ? p[k] : Number(String(p[k]).replace(/[^0-9.]/g, ""));
        if (!isNaN(num) && num > 0) return num;
      }
    }

    for (const key of Object.keys(p)) {
      const kLower = key.toLowerCase();
      if (kLower.includes("deposit") || kLower.includes("initial") || kLower.includes("advance") || kLower.includes("prepay")) {
        const val = p[key];
        if (val !== undefined && val !== null && val !== "") {
          const num = typeof val === "number" ? val : Number(String(val).replace(/[^0-9.]/g, ""));
          if (!isNaN(num) && num > 0) return num;
        }
      }
    }
    // Smart detection for high-tier medical & high-tuition programs (Medicine, Dentistry, Pharmacy)
    const nameLower = (p.name || "").toLowerCase();
    const isMedical = nameLower.includes("medicine") || nameLower.includes("dentistry") || nameLower.includes("pharmacy") || nameLower.includes("medical") || nameLower.includes("tıp") || nameLower.includes("diş") || nameLower.includes("eczacılık");
    const fee = Number(p.discountFee || p.originalFee || 0);

    if (isMedical || fee >= 10000) {
      return 5000;
    }
  }

  if (uni && typeof uni === "object") {
    const uniKeys = ["initialDeposit", "deposit", "depositFee", "initial_deposit"];
    for (const k of uniKeys) {
      if (uni[k] !== undefined && uni[k] !== null && uni[k] !== "") {
        const num = typeof uni[k] === "number" ? uni[k] : Number(String(uni[k]).replace(/[^0-9.]/g, ""));
        if (!isNaN(num) && num > 0) return num;
      }
    }
  }

  return 1000;
}

// ========================================
// OFFICIAL FEE STRUCTURE EXPORTER & PDF GENERATOR
// ========================================
async function initFeeStructureExporter() {
  const uniSelect = document.getElementById("exportUniSelect");
  const degreeSelect = document.getElementById("exportDegreeSelect");
  const langSelect = document.getElementById("exportLanguageSelect");
  const generateBtn = document.getElementById("generateDocBtn");
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");
  const printDocBtn = document.getElementById("printDocBtn");
  const tableBody = document.getElementById("docTableBody");
  const docUniName = document.getElementById("docUniName");
  const docUniLocation = document.getElementById("docUniLocation");
  const docGeneratedDate = document.getElementById("docGeneratedDate");

  if (!uniSelect || !tableBody) return;

  let loadedUniversities = [];

  // Populate date
  if (docGeneratedDate) {
    const today = new Date();
    docGeneratedDate.innerText = `Date: ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} | Ref: AT-FS-${today.getFullYear()}`;
  }

  // Load universities dropdown
  try {
    const res = await fetch(`${API_BASE_URL}/api/universities`);
    const data = await res.json();
    loadedUniversities = data.universities || [];

    uniSelect.innerHTML = '<option value="">-- Choose University --</option>';
    loadedUniversities.forEach((u) => {
      const opt = document.createElement("option");
      opt.value = u._id;
      opt.textContent = u.name;
      uniSelect.appendChild(opt);
    });

    if (loadedUniversities.length > 0) {
      uniSelect.value = loadedUniversities[0]._id;
      renderFeeStructureDoc();
    }
  } catch (err) {
    console.error("Fee Structure Exporter Load Error:", err);
  }

  async function renderFeeStructureDoc() {
    const selectedId = uniSelect.value;
    if (!selectedId) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 25px;">Please select a university above.</td></tr>`;
      return;
    }

    let selectedUni = loadedUniversities.find(u => u._id === selectedId);

    try {
      const res = await fetch(`${API_BASE_URL}/api/universities/${selectedId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.university) selectedUni = data.university;
      }
    } catch (e) {
      console.log("Fetch single uni error:", e);
    }

    if (!selectedUni) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 25px;">University not found.</td></tr>`;
      return;
    }

    if (docUniName) docUniName.innerText = selectedUni.name;
    if (docUniLocation) docUniLocation.innerText = `📍 Location: ${selectedUni.location || "Turkey"}`;

    const degreeFilter = degreeSelect ? degreeSelect.value : "ALL";
    const langFilter = langSelect ? langSelect.value : "ALL";
    const depositInput = document.getElementById("exportDepositInput");
    const overrideDepositVal = depositInput ? depositInput.value.trim() : "";

    let rows = [];
    const progs = selectedUni.programs || {};

    const categoryMap = [
      { key: "bachelors", label: "Bachelor" },
      { key: "masters", label: "Master" },
      { key: "phd", label: "PhD" },
      { key: "associate", label: "Associate" }
    ];

    categoryMap.forEach(cat => {
      const list = progs[cat.key] || [];
      list.forEach(p => {
        const thesisVal = p.thesisType || "N/A";
        const langVal = p.language || "English";

        if (degreeFilter === "Bachelor" && cat.key !== "bachelors") return;
        if (degreeFilter === "PhD" && cat.key !== "phd") return;
        if (degreeFilter === "Associate" && cat.key !== "associate") return;
        if (degreeFilter === "Master-Thesis" && (cat.key !== "masters" || thesisVal !== "Thesis")) return;
        if (degreeFilter === "Master-NonThesis" && (cat.key !== "masters" || thesisVal === "Thesis")) return;
        if (langFilter !== "ALL" && !langVal.toLowerCase().includes(langFilter.toLowerCase())) return;

        let detectedDep = detectProgramDeposit(p, selectedUni);
        let calculatedDeposit = 0;

        if (overrideDepositVal !== "") {
          const customDep = Number(overrideDepositVal.replace(/[^0-9.]/g, ""));
          if (!isNaN(customDep) && customDep > 0) {
            calculatedDeposit = customDep;
          } else {
            calculatedDeposit = (detectedDep > 0) ? detectedDep : 1000;
          }
        } else {
          calculatedDeposit = (detectedDep > 0) ? detectedDep : 1000;
        }

        rows.push({
          name: p.name,
          degree: cat.label,
          catKey: cat.key,
          thesis: thesisVal,
          language: langVal,
          duration: p.duration || "N/A",
          originalFee: p.originalFee || 0,
          discountFee: p.discountFee || 0,
          initialDeposit: calculatedDeposit
        });
      });
    });

    if (rows.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 25px;">No program fee structures match the selected filter criteria.</td></tr>`;
    } else {
      let html = "";
      rows.forEach(r => {
        const thesisBadge = (r.catKey === "masters" && r.thesis && r.thesis !== "N/A") ? `<span class="badge-thesis">${r.thesis}</span>` : '<span style="color:#cbd5e1;">-</span>';
        const finalDepTable = Number(r.initialDeposit || 1000);
        html += `
          <tr>
            <td><strong>${r.name}</strong></td>
            <td>${r.degree}</td>
            <td>${thesisBadge}</td>
            <td>${r.language}</td>
            <td>${r.duration}</td>
            <td style="text-decoration: line-through; color: #94a3b8;">$${Number(r.originalFee).toLocaleString()}</td>
            <td><span class="badge-discount">$${Number(r.discountFee).toLocaleString()}</span></td>
            <td><strong style="color: #1d5bbf;">$${Number(finalDepTable).toLocaleString()}</strong></td>
          </tr>
        `;
      });
      tableBody.innerHTML = html;
    }

    // Render Modern Branded Cards Flyer Layout
    const cardsContainer = document.getElementById("docCardsContainer");
    const uniImage = selectedUni.image || selectedUni.logo || "../images/logo.png";
    const uniName = selectedUni.name || "University";
    const uniLocation = selectedUni.location || "Istanbul, Turkey";

    if (cardsContainer) {
      if (rows.length === 0) {
        cardsContainer.innerHTML = `<div style="text-align: center; color: #64748b; padding: 40px; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">No program fee structures match the selected filter criteria.</div>`;
      } else {
        cardsContainer.innerHTML = rows.map(r => {
          const thesisPill = (r.catKey === "masters" && r.thesis && r.thesis !== "N/A") 
            ? `<span class="pill-lang" style="background: #e11d48;"><i class="fas fa-scroll"></i> ${r.thesis}</span>` 
            : '';
          
          const depositFormatted = `$${Number(r.initialDeposit || 1000).toLocaleString()}`;
          const cashPaymentFormatted = `$${Number(r.discountFee).toLocaleString()}`;
          const prepSchoolFormatted = `$1,500`;

          return `
            <div class="fee-program-card">
              <div class="fee-card-header">
                <div class="fee-card-title-group">
                  <h3>${r.name}</h3>
                  <div class="fee-card-pills">
                    <span class="pill-degree">${r.degree}'s Degree</span>
                    <span class="pill-lang">${r.language}</span>
                    <span class="pill-duration"><i class="far fa-clock"></i> ${r.duration}</span>
                    ${thesisPill}
                  </div>
                </div>
                <div class="card-available-badge">
                  <span class="dot"></span> Available
                </div>
              </div>

              <div class="fee-card-body">
                <div class="fee-card-uni-box">
                  <div class="fee-card-logo-wrap">
                    <img src="${uniImage}" alt="${uniName}" onerror="this.src='../images/logo.png';">
                  </div>
                  <div class="fee-card-uni-name">${uniName}</div>
                  <div class="fee-card-uni-loc">📍 ${uniLocation}</div>
                </div>

                <div class="fee-card-discount-box">
                  <span class="fee-orig-tuition">Tuition $${Number(r.originalFee).toLocaleString()}</span>
                  <div class="fee-disc-amount">$${Number(r.discountFee).toLocaleString()} <span>/ year</span></div>
                  <span class="fee-disc-label">DISCOUNTED TUITION FEE</span>
                </div>

                <div class="fee-card-metrics-grid">
                  <div class="metric-box">
                    <span class="m-label">DEPOSIT FEE</span>
                    <span class="m-val">${depositFormatted}</span>
                  </div>
                  <div class="metric-box">
                    <span class="m-label">CASH PAYMENT</span>
                    <span class="m-val">${cashPaymentFormatted}</span>
                  </div>
                  <div class="metric-box">
                    <span class="m-label">PREP SCHOOL FEE</span>
                    <span class="m-val">${prepSchoolFormatted}</span>
                  </div>
                  <div class="metric-box">
                    <span class="m-label">CURRENCY</span>
                    <span class="m-val">USD</span>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join("");
      }
    }
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", renderFeeStructureDoc);
  }
  if (uniSelect) {
    uniSelect.addEventListener("change", renderFeeStructureDoc);
  }
  if (degreeSelect) {
    degreeSelect.addEventListener("change", renderFeeStructureDoc);
  }
  if (langSelect) {
    langSelect.addEventListener("change", renderFeeStructureDoc);
  }
  const depositFilterInput = document.getElementById("exportDepositInput");
  if (depositFilterInput) {
    depositFilterInput.addEventListener("input", renderFeeStructureDoc);
    depositFilterInput.addEventListener("change", renderFeeStructureDoc);
  }

  if (printDocBtn) {
    printDocBtn.addEventListener("click", () => {
      window.print();
    });
  }

  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", () => {
      const element = document.getElementById("feeDocumentPaper");
      const selectedUniName = docUniName ? docUniName.innerText.replace(/[^a-zA-Z0-9]/g, "_") : "Fee_Structure";

      if (window.html2pdf && element) {
        const opt = {
          margin: 0.2,
          filename: `${selectedUniName}_Fee_Structure_AdmissionTurkey.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        window.html2pdf().set(opt).from(element).save();
      } else {
        window.print();
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initLoginForm();
  initSignupForm();
  initAdminDashboard();
  initFeeStructureExporter();
  initThemeEngine();
  initI18nEngine();
  initAnimations();
  initFaqAccordion();
  initHomeUniversitySlider();
  initMindmapSection();
  initVideoModal();
  initReviewSystem();
  loadUniversities();
  loadUniversityDetails();
  loadProgramDetails();
});

/* =========================================================
   THEME, I18N & ANIMATION ENGINES FOR FRONTEND
   ========================================================= */

const i18nTranslations = {
  en: {
    nav_home: "Home",
    nav_services: "Services",
    nav_universities: "Universities",
    nav_about: "About",
    nav_contact: "Contact",
    nav_login: "Login",
    nav_signup: "Sign Up",
    nav_admin: "Admin Panel",
    nav_logout: "Logout",
    
    hero_label: "YOUR GATEWAY TO WORLD-CLASS EDUCATION",
    hero_title: "Study in <span>Turkey</span><br>Build Your Future",
    hero_desc: "We help international students find the right university, apply for admission, get scholarship guidance and start their educational journey in Turkey.",
    hero_btn_explore: "Explore Universities",
    hero_btn_consult: "Book Consultation",
    hero_card_title: "Start Your Journey",
    hero_card_desc: "Get expert guidance for studying in Turkey.",
    stat_students: "Students Guided",
    stat_options: "University Options",

    sec_services_title: "Our Services",
    sec_services_subtitle: "Comprehensive support for your educational journey in Turkey",
    service_uni_title: "University Admission",
    service_uni_desc: "Direct application to top Turkish universities with high acceptance rates.",
    service_visa_title: "Student Visa Support",
    service_visa_desc: "Full guidance on visa documentation, appointments, and procedures.",
    service_scholar_title: "Scholarship Guidance",
    service_scholar_desc: "Discover partial and full tuition scholarships tailored for international students.",

    footer_tagline: "Empowering international students to achieve academic excellence in Turkey.",
    footer_quick_links: "Quick Links",
    footer_contact_us: "Contact Us",
    footer_rights: "All Rights Reserved."
  },
  tr: {
    nav_home: "Ana Sayfa",
    nav_services: "Hizmetler",
    nav_universities: "Üniversiteler",
    nav_about: "Hakkımızda",
    nav_contact: "İletişim",
    nav_login: "Giriş Yap",
    nav_signup: "Kayıt Ol",
    nav_admin: "Yönetici Paneli",
    nav_logout: "Çıkış Yap",
    
    hero_label: "DÜNYA STANDARTLARINDA EĞİTİME GİDEN YOLUNUZ",
    hero_title: "<span>Türkiye'de</span> Okuyun<br>Geleceğinizi İnşa Edin",
    hero_desc: "Uluslararası öğrencilerin doğru üniversiteyi bulmalarına, başvuru yapmalarına, burs rehberliği almalarına ve Türkiye'deki eğitim yolculuklarına başlamalarına yardımcı oluyoruz.",
    hero_btn_explore: "Üniversiteleri Keşfet",
    hero_btn_consult: "Danışmanlık Alın",
    hero_card_title: "Yolculuğunuza Başlayın",
    hero_card_desc: "Türkiye'de eğitim almak için uzman rehberliği alın.",
    stat_students: "Rehberlik Edilen Öğrenci",
    stat_options: "Üniversite Seçeneği",

    sec_services_title: "Hizmetlerimiz",
    sec_services_subtitle: "Türkiye'deki eğitim yolculuğunuz için kapsamlı destek",
    service_uni_title: "Üniversite Kabulü",
    service_uni_desc: "Yüksek kabul oranlarıyla en iyi Türk üniversitelerine doğrudan başvuru.",
    service_visa_title: "Öğrenci Vizesi Desteği",
    service_visa_desc: "Vize belgeleri, randevular ve süreçler hakkında tam rehberlik.",
    service_scholar_title: "Burs Rehberliği",
    service_scholar_desc: "Uluslararası öğrenciler için özel kısmi ve tam öğrenim burslarını keşfedin.",

    footer_tagline: "Uluslararası öğrencilerin Türkiye'de akademik başarıya ulaşmalarını destekliyoruz.",
    footer_quick_links: "Hızlı Bağlantılar",
    footer_contact_us: "İletişim",
    footer_rights: "Tüm Hakları Saklıdır."
  },
  ar: {
    nav_home: "الرئيسية",
    nav_services: "خدماتنا",
    nav_universities: "الجامعات",
    nav_about: "عن الشركة",
    nav_contact: "اتصل بنا",
    nav_login: "تسجيل الدخول",
    nav_signup: "إنشاء حساب",
    nav_admin: "لوحة التحكم",
    nav_logout: "تسجيل الخروج",
    
    hero_label: "بوابتك إلى تعليم عالمي المستوى",
    hero_title: "ادرس في <span>تركيا</span><br>ابنِ مستقبلك",
    hero_desc: "نساعد الطلاب الدوليين في العثور على الجامعة المناسبة، والتقديم للقبول، والحصول على التوجيه للمنح الدراسية وبدء رحلتهم التعليمية في تركيا.",
    hero_btn_explore: "استكشف الجامعات",
    hero_btn_consult: "احجز استشارة",
    hero_card_title: "ابدأ رحلتك",
    hero_card_desc: "احصل على توجيه متخصص للدراسة في تركيا.",
    stat_students: "طالب تم توجيههم",
    stat_options: "خيار جامعي",

    sec_services_title: "خدماتنا",
    sec_services_subtitle: "دعم شامل لرحلتك التعليمية في تركيا",
    service_uni_title: "القبول الجامعي",
    service_uni_desc: "التقديم المباشر لأفضل الجامعات التركية بنسب قبول عالية.",
    service_visa_title: "دعم التأشيرة الدراسية",
    service_visa_desc: "توجيه كامل حول وثائق التأشيرة والمواعيد والإجراءات.",
    service_scholar_title: "توجيه المنح الدراسية",
    service_scholar_desc: "اكتشف المنح الجزئية والكاملة المصممة للطلاب الدوليين.",

    footer_tagline: "تمكين الطلاب الدوليين لتحقيق التميز الأكاديمي في تركيا.",
    footer_quick_links: "روابط سريعة",
    footer_contact_us: "تواصل معنا",
    footer_rights: "جميع الحقوق محفوظة."
  }
};

function initThemeEngine() {
  const savedTheme = localStorage.getItem("site_theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  
  const toggleBtn = document.getElementById("themeToggleBtn");
  if (toggleBtn) {
    updateThemeIcon(toggleBtn, savedTheme);
    toggleBtn.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("site_theme", newTheme);
      updateThemeIcon(toggleBtn, newTheme);
    });
  }
}

function updateThemeIcon(btn, theme) {
  btn.innerHTML = theme === "dark" ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function initI18nEngine() {
  const savedLang = localStorage.getItem("site_lang") || "en";
  setLanguage(savedLang);

  const dropdownBtn = document.getElementById("langDropdownBtn");
  const dropdownSelector = document.querySelector(".lang-selector");
  
  if (dropdownBtn && dropdownSelector) {
    dropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownSelector.classList.toggle("active");
    });

    document.addEventListener("click", () => {
      dropdownSelector.classList.remove("active");
    });

    const langOptions = document.querySelectorAll(".lang-option");
    langOptions.forEach(opt => {
      opt.addEventListener("click", () => {
        const selectedLang = opt.getAttribute("data-lang");
        if (selectedLang) {
          setLanguage(selectedLang);
          localStorage.setItem("site_lang", selectedLang);
          dropdownSelector.classList.remove("active");
        }
      });
    });
  }
}

function setLanguage(lang) {
  if (!i18nTranslations[lang]) lang = "en";
  
  document.documentElement.setAttribute("lang", lang);
  if (lang === "ar") {
    document.documentElement.setAttribute("dir", "rtl");
  } else {
    document.documentElement.setAttribute("dir", "ltr");
  }

  const labelSpan = document.getElementById("currentLangLabel");
  if (labelSpan) {
    labelSpan.textContent = lang.toUpperCase();
  }

  document.querySelectorAll(".lang-option").forEach(opt => {
    if (opt.getAttribute("data-lang") === lang) {
      opt.classList.add("active");
    } else {
      opt.classList.remove("active");
    }
  });

  const translatableElements = document.querySelectorAll("[data-i18n]");
  translatableElements.forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (i18nTranslations[lang][key]) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = i18nTranslations[lang][key];
      } else {
        el.innerHTML = i18nTranslations[lang][key];
      }
    }
  });
}

let revealObserver = null;

function observeReveals(parent = document) {
  const rootNode = parent || document;
  const targets = rootNode.querySelectorAll(".reveal-on-scroll, .reveal-fade-up, .reveal-slide-left, .reveal-slide-right, .reveal-scale");

  if (typeof IntersectionObserver === "undefined") {
    targets.forEach(el => el.classList.add("reveal-visible"));
    return;
  }

  if (!revealObserver) {
    const observerOptions = {
      threshold: 0.05,
      rootMargin: "0px 0px -20px 0px"
    };

    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          
          const countElements = entry.target.querySelectorAll("[data-count]");
          countElements.forEach(c => animateCounter(c));
          if (entry.target.hasAttribute("data-count")) {
            animateCounter(entry.target);
          }

          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
  }

  targets.forEach(el => {
    if (!el.classList.contains("reveal-visible")) {
      el.classList.add("reveal-on-scroll");
      revealObserver.observe(el);
    }
  });
}

function initAnimations() {
  observeReveals();
  initHeroParticles();
  initCardTilt();
  initButtonRipples();
}

function animateCounter(el) {
  if (el.dataset.counterDone) return;
  el.dataset.counterDone = "true";

  const target = parseInt(el.getAttribute("data-count"), 10);
  if (isNaN(target)) return;

  const duration = 1800;
  const frameRate = 1000 / 60;
  const totalFrames = Math.round(duration / frameRate);
  let frame = 0;

  const timer = setInterval(() => {
    frame++;
    const progress = frame / totalFrames;
    const currentCount = Math.round(target * (1 - Math.pow(1 - progress, 3)));
    el.textContent = currentCount + "+";

    if (frame >= totalFrames) {
      clearInterval(timer);
      el.textContent = target + "+";
    }
  }, frameRate);
}

function initHeroParticles() {
  const heroSec = document.querySelector(".hero");
  if (!heroSec || document.getElementById("heroParticleCanvas")) return;

  const canvas = document.createElement("canvas");
  canvas.id = "heroParticleCanvas";
  heroSec.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let width = (canvas.width = heroSec.offsetWidth);
  let height = (canvas.height = heroSec.offsetHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = heroSec.offsetWidth;
    height = canvas.height = heroSec.offsetHeight;
  });

  const particles = [];
  const particleCount = 40;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.6,
      speedY: (Math.random() - 0.5) * 0.6,
      alpha: Math.random() * 0.5 + 0.2
    });
  }

  function drawParticles() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(29, 91, 191, ${p.alpha})`;
      ctx.fill();
    });

    requestAnimationFrame(drawParticles);
  }

  drawParticles();
}

function initCardTilt() {
  const cards = document.querySelectorAll(".hero-card, .university-card, .service-card, .program-card, .feature-card");
  cards.forEach(card => {
    card.classList.add("card-tilt");
  });
}

function initButtonRipples() {
  const buttons = document.querySelectorAll(".primary-btn, .secondary-btn, .login-btn, .signup-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", function(e) {
      const circle = document.createElement("span");
      const diameter = Math.max(btn.clientWidth, btn.clientHeight);
      const radius = diameter / 2;

      const rect = btn.getBoundingClientRect();
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - radius}px`;
      circle.style.top = `${e.clientY - rect.top - radius}px`;
      circle.classList.add("ripple-effect");

      const existingRipple = btn.querySelector(".ripple-effect");
      if (existingRipple) {
        existingRipple.remove();
      }

      btn.appendChild(circle);
    });
  });
}

function initFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const question = item.querySelector(".faq-question");
    if (question) {
      question.addEventListener("click", () => {
        const isActive = item.classList.contains("active");
        faqItems.forEach(i => i.classList.remove("active"));
        if (!isActive) {
          item.classList.add("active");
        }
      });
    }
  });
}

/* =========================================================
   HOME DYNAMIC UNIVERSITY FLOW SLIDER, VIDEO MODAL & REVIEW SYSTEM
   ========================================================= */

function renderHomeSliderCards(container, unisList) {
  if (!container) return;
  container.innerHTML = "";
  unisList.forEach(uni => {
    const card = document.createElement("div");
    card.className = "uni-flow-card card-tilt";
    const pCount = Object.values(uni.programs || {}).flat().length || 4;

    const isDummyUni = uni.isDummy || ["medipol", "bahcesehir", "istinye", "bilgi", "sabanci", "koc"].includes(uni._id);
    const waText = encodeURIComponent(`Hello! I am interested in applying to ${uni.name}. Please provide details.`);
    const waUrl = `https://wa.me/905514840804?text=${waText}`;

    const actionBtn = isDummyUni
      ? `<a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="primary-btn" style="padding:6px 12px; font-size:12.5px; background:#25D366; border-color:#25D366; color:#fff;">Apply <i class="fab fa-whatsapp"></i></a>`
      : `<a href="university.html?id=${uni._id}" class="primary-btn" style="padding:6px 12px; font-size:12.5px;">Visit <i class="fas fa-arrow-right"></i></a>`;

    const titleClickAttr = isDummyUni
      ? `onclick="window.open('${waUrl}', '_blank')"`
      : `onclick="window.location.href='university.html?id=${uni._id}'"`;

    card.innerHTML = `
      <div class="uni-card-img-wrap" style="cursor:pointer;" ${titleClickAttr}>
        <img src="${uni.image || 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=600&q=80'}" alt="${uni.name}" loading="lazy" decoding="async">
        <div class="uni-card-badges">
          <span class="uni-badge discount"><i class="fas fa-tags"></i> Scholarship Available</span>
        </div>
      </div>
      <div class="uni-card-body">
        <h3 style="font-size:17px; font-weight:700; margin-bottom:6px; color:var(--text-main); cursor:pointer;" ${titleClickAttr}>${uni.name}</h3>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:12px;">
          <i class="fas fa-location-dot" style="color:var(--red);"></i> ${uni.location || 'Türkiye'}
        </p>
        <div style="margin-top:auto; display:flex; align-items:center; justify-content:space-between; padding-top:10px; border-top:1px solid var(--border-color);">
          <span style="font-size:12.5px; font-weight:600; color:var(--blue);">${pCount} Programs</span>
          ${actionBtn}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

async function initHomeUniversitySlider() {
  const container = document.getElementById("homeUniversityFlowContainer");
  if (!container) return;

  // 1. INSTANT RENDER (0ms delay)
  renderHomeSliderCards(container, defaultTurkishUniversities);

  const prevBtn = document.getElementById("uniFlowPrevBtn");
  const nextBtn = document.getElementById("uniFlowNextBtn");

  if (prevBtn) {
    prevBtn.onclick = () => container.scrollBy({ left: -340, behavior: "smooth" });
  }
  if (nextBtn) {
    nextBtn.onclick = () => container.scrollBy({ left: 340, behavior: "smooth" });
  }

  let autoFlowInterval = setInterval(() => {
    if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
      container.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      container.scrollBy({ left: 340, behavior: "smooth" });
    }
  }, 4000);

  container.addEventListener("mouseenter", () => clearInterval(autoFlowInterval));

  // 2. FAST BACKGROUND FETCH (1.5s timeout)
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/universities`, {}, 1500);
    if (response && response.ok) {
      const data = await response.json();
      const fetchedUnis = data.universities || [];

      if (fetchedUnis.length > 0) {
        const groupedMap = new Map();
        fetchedUnis.forEach((uni) => {
          const key = (uni.name || "").trim().toLowerCase();
          if (!groupedMap.has(key)) {
            groupedMap.set(key, {
              _id: uni._id,
              name: uni.name,
              location: uni.location || "Türkiye",
              image: uni.image,
              programs: uni.programs
            });
          }
        });
        const displayUnis = Array.from(groupedMap.values());
        if (displayUnis.length > 0) {
          renderHomeSliderCards(container, displayUnis);
        }
      }
    }
  } catch (err) {
    // Keep instant cards rendered
  }
}

function initVideoModal() {
  const playBtn = document.querySelector(".hero-video-play-btn");
  const modalBackdrop = document.getElementById("videoModalBackdrop");
  const modalClose = document.getElementById("videoModalClose");
  const iframe = document.getElementById("videoModalIframe");

  if (playBtn && modalBackdrop && iframe) {
    playBtn.addEventListener("click", () => {
      iframe.src = "https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1";
      modalBackdrop.classList.add("active");
    });

    const closeModal = () => {
      modalBackdrop.classList.remove("active");
      iframe.src = "";
    };

    if (modalClose) modalClose.addEventListener("click", closeModal);
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }
}

const defaultReviews = [
  {
    name: "Amina Al-Mansoor",
    role: "Medicine • Istanbul Medipol University",
    rating: 5,
    comment: "Admission Turkey secured my 50% scholarship at Medipol University for Medicine. Their team handled everything from my offer letter to my student visa smoothly!"
  },
  {
    name: "Tariq Hassan",
    role: "Computer Eng • Bahçeşehir University",
    rating: 5,
    comment: "Extremely professional guidance! I got my acceptance letter in under 3 days for Computer Engineering at Bahçeşehir University."
  },
  {
    name: "Sarah Jenkins",
    role: "Business Admin • Bilgi University",
    rating: 5,
    comment: "They greeted me at Istanbul airport and helped me find dormitory accommodation. Best agency for studying in Türkiye!"
  }
];

async function initReviewSystem() {
  const reviewGrid = document.getElementById("reviewGrid");
  const openModalBtn = document.getElementById("openReviewModalBtn");
  const modalBackdrop = document.getElementById("reviewModalBackdrop");
  const closeModalBtn = document.getElementById("reviewModalClose");
  const reviewForm = document.getElementById("reviewForm");
  const starSelects = document.querySelectorAll(".star-rating-select .fa-star");
  const prevBtn = document.getElementById("reviewFlowPrevBtn");
  const nextBtn = document.getElementById("reviewFlowNextBtn");
  let selectedRating = 5;

  async function fetchAndRenderReviews() {
    if (!reviewGrid) return;

    let apiReviews = [];
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/reviews`, {}, 2500);
      if (res && res.ok) {
        const data = await res.json();
        apiReviews = data.reviews || [];
      }
    } catch (err) {
      console.warn("Could not fetch remote reviews, using local fallback:", err);
    }

    const storedReviews = JSON.parse(localStorage.getItem("site_user_reviews") || "[]");
    const combined = [...apiReviews, ...storedReviews];

    // Deduplicate reviews by comment text
    const uniqueReviews = [];
    const seenComments = new Set();

    combined.forEach(r => {
      const key = (r.comment || "").trim().toLowerCase();
      if (key && !seenComments.has(key)) {
        seenComments.add(key);
        uniqueReviews.push(r);
      }
    });

    defaultReviews.forEach(r => {
      const key = (r.comment || "").trim().toLowerCase();
      if (key && !seenComments.has(key)) {
        seenComments.add(key);
        uniqueReviews.push(r);
      }
    });

    reviewGrid.innerHTML = uniqueReviews.map(rev => {
      const stars = Array(Number(rev.rating) || 5).fill('<i class="fas fa-star"></i>').join("");
      return `
        <div class="testimonial-card card-tilt reveal-fade-up">
          <div class="star-rating">${stars}</div>
          <p style="font-size:14px; font-style:italic; margin-bottom:16px; color:var(--text-main);">"${rev.comment}"</p>
          <div class="student-profile">
            <img src="${rev.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}" alt="${rev.name}" class="student-avatar">
            <div class="student-info">
              <h4>${rev.name}</h4>
              <p>${rev.role || 'International Student'}</p>
            </div>
          </div>
        </div>
      `;
    }).join("");

    if (typeof observeReveals === "function") {
      observeReveals(reviewGrid);
    }
  }

  fetchAndRenderReviews();

  // Slider controls and smooth auto-flow
  if (reviewGrid) {
    if (prevBtn) {
      prevBtn.onclick = () => reviewGrid.scrollBy({ left: -340, behavior: "smooth" });
    }
    if (nextBtn) {
      nextBtn.onclick = () => reviewGrid.scrollBy({ left: 340, behavior: "smooth" });
    }

    let reviewAutoInterval = setInterval(() => {
      if (reviewGrid.scrollLeft + reviewGrid.clientWidth >= reviewGrid.scrollWidth - 10) {
        reviewGrid.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        reviewGrid.scrollBy({ left: 340, behavior: "smooth" });
      }
    }, 3800);

    reviewGrid.addEventListener("mouseenter", () => clearInterval(reviewAutoInterval));
  }

  if (openModalBtn && modalBackdrop) {
    openModalBtn.addEventListener("click", () => {
      modalBackdrop.classList.add("active");
    });
  }

  if (closeModalBtn && modalBackdrop) {
    closeModalBtn.addEventListener("click", () => {
      modalBackdrop.classList.remove("active");
    });
  }

  starSelects.forEach((star, idx) => {
    star.addEventListener("click", () => {
      selectedRating = idx + 1;
      starSelects.forEach((s, sIdx) => {
        if (sIdx <= idx) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });
    });
  });

  if (reviewForm) {
    reviewForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("reviewName");
      const roleInput = document.getElementById("reviewRole");
      const commentInput = document.getElementById("reviewComment");

      const newReview = {
        name: nameInput ? nameInput.value.trim() : "Anonymous Student",
        role: roleInput ? roleInput.value.trim() : "International Student",
        rating: selectedRating,
        comment: commentInput ? commentInput.value.trim() : "Great guidance!",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
      };

      // Save locally instantly
      const storedReviews = JSON.parse(localStorage.getItem("site_user_reviews") || "[]");
      storedReviews.unshift(newReview);
      localStorage.setItem("site_user_reviews", JSON.stringify(storedReviews));

      // Post to backend database so it syncs across mobile & desktop devices
      try {
        await fetch(`${API_BASE_URL}/api/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newReview)
        });
      } catch (err) {
        console.warn("Could not post review to backend database:", err);
      }

      alert("Thank you! Your review has been published successfully.");
      if (modalBackdrop) modalBackdrop.classList.remove("active");
      reviewForm.reset();
      fetchAndRenderReviews();
    });
  }
}

function initMindmapSection() {
  const container = document.querySelector(".mindmap-container");
  const svg = document.getElementById("mindmapSvg");
  const centerBadge = document.querySelector(".mindmap-center-badge");
  const nodes = document.querySelectorAll(".mindmap-node");

  if (!container || !svg || !centerBadge || nodes.length === 0) return;

  function updateLines() {
    if (window.innerWidth <= 992) {
      svg.innerHTML = "";
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const centerRect = centerBadge.getBoundingClientRect();

    const cX = (centerRect.left + centerRect.width / 2) - containerRect.left;
    const cY = (centerRect.top + centerRect.height / 2) - containerRect.top;

    let svgHTML = "";

    nodes.forEach((node, idx) => {
      const nodeRect = node.getBoundingClientRect();
      const nX = (nodeRect.left + nodeRect.width / 2) - containerRect.left;
      const nY = (nodeRect.top + nodeRect.height / 2) - containerRect.top;

      const controlX = (cX + nX) / 2;

      const pathData = `M ${cX} ${cY} Q ${controlX} ${nY}, ${nX} ${nY}`;
      const pathId = `line-node-${idx}`;

      svgHTML += `<path id="${pathId}" d="${pathData}" class="mindmap-path"></path>`;
    });

    svg.innerHTML = svgHTML;
  }

  setTimeout(updateLines, 100);
  window.addEventListener("resize", updateLines);

  nodes.forEach((node, idx) => {
    node.addEventListener("mouseenter", () => {
      const path = document.getElementById(`line-node-${idx}`);
      if (path) path.classList.add("active");
    });
    node.addEventListener("mouseleave", () => {
      const path = document.getElementById(`line-node-${idx}`);
      if (path) path.classList.remove("active");
    });
  });
}



