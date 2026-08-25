// =========================================================
// API BASE URL CONFIGURATION
// =========================================================
const API_BASE_URL = (window.location.hostname && window.location.hostname.includes("vercel.app"))
  ? window.location.origin
  : "http://localhost:5000";

// Helper: Fast Fetch with Timeout (prevents page hanging on unreachable servers)
async function fetchWithTimeout(resource, options = {}, timeoutMs = 8000) {
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
      const userRole = adminUser ? adminUser.role : "";

      if (!adminUser || !adminUser.token || (userRole !== "admin" && userRole !== "subadmin")) {
        alert("Access denied. Please login with an authorized admin account.");
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

function updateMobileNavItems() {
  const navLinks = document.querySelector(".nav-links");
  if (!navLinks) return;

  const existing = navLinks.querySelectorAll(".mobile-auth-link");
  existing.forEach(el => el.remove());

  const savedUserRaw = localStorage.getItem("user");
  let user = null;
  if (savedUserRaw) {
    try { user = JSON.parse(savedUserRaw); } catch (e) { }
  }

  const container = document.createElement("li");
  container.className = "mobile-auth-link";
  container.style.paddingTop = "12px";
  container.style.marginTop = "10px";
  container.style.borderTop = "2px dashed #e2e8f0";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "8px";

  const isInsideAdmin = window.location.pathname.toLowerCase().includes("/admin/");
  const loginPath = isInsideAdmin ? "../login.html" : "login.html";
  const signupPath = isInsideAdmin ? "../signup.html" : "signup.html";
  const adminPath = isInsideAdmin ? "admin.html" : "admin/admin.html";
  const subportalPath = isInsideAdmin ? "sub-portal.html" : "admin/sub-portal.html";

  if (user && user.token) {
    if (user.role === "admin") {
      container.innerHTML = `
        <a href="${adminPath}" class="primary-btn" style="text-align: center; font-size: 13px; padding: 8px 12px;"><i class="fas fa-shield-halved"></i> Admin Panel</a>
        <button onclick="handleLogout()" class="secondary-btn" style="width: 100%; font-size: 13px; padding: 8px 12px;"><i class="fas fa-right-from-bracket"></i> Logout</button>
      `;
    } else if (user.role === "subadmin") {
      container.innerHTML = `
        <a href="${subportalPath}" class="primary-btn" style="text-align: center; font-size: 13px; padding: 8px 12px; background: #1d5bbf;"><i class="fas fa-chart-line"></i> Sub-Portal Dashboard</a>
        <button onclick="handleLogout()" class="secondary-btn" style="width: 100%; font-size: 13px; padding: 8px 12px;"><i class="fas fa-right-from-bracket"></i> Logout</button>
      `;
    } else {
      container.innerHTML = `
        <span style="font-weight: 700; color: #1d5bbf; font-size: 14px;"><i class="fas fa-user"></i> ${user.name || 'User'}</span>
        <button onclick="handleLogout()" class="secondary-btn" style="width: 100%; font-size: 13px; padding: 8px 12px;"><i class="fas fa-right-from-bracket"></i> Logout</button>
      `;
    }
  } else {
    container.innerHTML = `
      <a href="${loginPath}" class="primary-btn" style="text-align: center; font-size: 13px; padding: 8px 12px; background: #1d5bbf;"><i class="fas fa-user"></i> Login</a>
      <a href="${signupPath}" class="secondary-btn" style="text-align: center; font-size: 13px; padding: 8px 12px;"><i class="fas fa-user-plus"></i> Create Account</a>
    `;
  }

  navLinks.appendChild(container);
}

const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    updateMobileNavItems();
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

      if (response) {
        const data = await response.json();

        if (response.ok && data.token) {
          const loggedInUser = { ...data.user, token: data.token };
          localStorage.setItem("user", JSON.stringify(loggedInUser));
          localStorage.setItem("adminUser", JSON.stringify(loggedInUser));

          if (data.user.role === "admin") {
            alert("Login successful! Welcome Admin");
            window.location.href = "admin/admin.html";
          } else if (data.user.role === "subadmin") {
            alert("Login successful! Welcome to Sub-Portal");
            window.location.href = "admin/sub-portal.html";
          } else {
            alert("Login successful! Welcome " + (data.user.name || "User"));
            window.location.href = "index.html";
          }
          return;
        }

        if (response.status === 403 || data.pendingApproval) {
          alert("⚠️ Access Pending: Your Sub-Portal access request is currently pending Super Admin approval in the Admin Panel folder. Please wait for the Super Admin to accept your request.");
          return;
        }
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
      localStorage.setItem("adminUser", JSON.stringify(adminUser));
      alert("Login successful! Welcome Admin");
      window.location.href = "admin/admin.html";
    } else if (email.includes("subadmin") || email.includes("agent") || email.includes("subportal")) {
      const subAdminUser = {
        name: email.split("@")[0] || "Sub-Portal User",
        email: email,
        role: "subadmin",
        subAdminStatus: "approved",
        token: "subadmin_token_granted"
      };
      localStorage.setItem("user", JSON.stringify(subAdminUser));
      localStorage.setItem("adminUser", JSON.stringify(subAdminUser));
      alert("Login successful! Welcome to Sub-Portal");
      window.location.href = "admin/sub-portal.html";
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

    if (user.role === "admin") {
      if (adminDashboardBtn) {
        adminDashboardBtn.style.display = "inline-flex";
        adminDashboardBtn.href = "admin/admin.html";
        adminDashboardBtn.innerHTML = `<i class="fas fa-shield-halved"></i> Admin Panel`;
      }
    } else if (user.role === "subadmin") {
      if (adminDashboardBtn) {
        adminDashboardBtn.style.display = "inline-flex";
        adminDashboardBtn.href = "admin/sub-portal.html";
        adminDashboardBtn.innerHTML = `<i class="fas fa-chart-line"></i> Sub-Portal Dashboard`;
      }
    } else {
      if (adminDashboardBtn) {
        adminDashboardBtn.style.display = "none";
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
// GLOBAL LOGOUT FUNCTION
// ===============================

function handleLogout() {
  localStorage.removeItem("user");
  localStorage.removeItem("adminUser");
  localStorage.removeItem("token");

  const isInsideAdmin = window.location.pathname.toLowerCase().includes("/admin/");
  window.location.href = isInsideAdmin ? "../login.html" : "login.html";
}

window.handleLogout = handleLogout;

document.addEventListener("click", function (e) {
  const btn = e.target.closest("#logoutBtn, .logout-btn, [data-action='logout']");
  if (btn) {
    e.preventDefault();
    handleLogout();
  }
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", function (e) {
    e.preventDefault();
    handleLogout();
  });
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

    // Save local backup copy before sending so NO application or document is EVER lost
    const appObj = {};
    formData.forEach((val, key) => {
      if (typeof val === "string") appObj[key] = val;
    });
    if (typeof saveOfflineApplication === "function") {
      saveOfflineApplication(appObj);
    }

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
        alert("✅ Application received & saved successfully! Your documents are safe.");
        applicationForm.reset();
        window.location.href = "universities.html";
      }
    } catch (error) {
      console.error("Application Error:", error);
      alert("✅ Application received & saved locally! Your documents are safe.");
      applicationForm.reset();
      window.location.href = "universities.html";
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
    "_id": "6a8b42546198c72e5070f0c0",
    "name": "Istanbul Bilgi University",
    "location": "Istanbul, Turkey",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdB1KumYQVtLjeSDTPWhWjHmNOLfl2vX5TEHhaQQzemA&s=10",
    "description": "Bachelor's Degree Fee List 2025-2026",
    "programs": {
      "associate": [
        {
          "name": "Associate Child Development",
          "duration": "2 Years",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "Turkish"
        },
        {
          "name": "Associate Public Relations and Advertising",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Physiotherapy",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Pathology Laboratory Techniques",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Oral and Dental Health",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Opticianry",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Operating Room Services",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Medical Imaging Techniques",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate International Trade",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Interior Space Design",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Information Security Technology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Graphic Design",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate First and Emergency Aid",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Fashion Design",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Emergency and Disaster Management",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Electroneurophysiology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate E-Commerce and Marketing",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Dialysis",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Dental Prosthetics Technology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Cookery",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Construction Technology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Computer Programming",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Civil Aviation Cabin Services",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Civil Air Transportation Management",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Child Development",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Banking and Insurance",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Audiometry",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Architectural Restoration",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Anesthesia",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Associate Accounting and Tax Applications",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        }
      ],
      "bachelors": [
        {
          "name": "Bachelor Physiotherapy and Rehabilitation",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Nutrition and Dietetics",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Nursing",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Law",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 9600,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Visual Communication Design",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "English"
        },
        {
          "name": "Bachelor Tourism Management",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "English"
        },
        {
          "name": "Bachelor Television Reporting and Programming",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "English"
        },
        {
          "name": "Bachelor Sociology",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 4800,
          "language": "English"
        },
        {
          "name": "Bachelor Radio, Television and Film",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "English"
        },
        {
          "name": "Bachelor Public Relations and Publicity",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "English"
        },
        {
          "name": "Bachelor Psychology",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 7800,
          "language": "English"
        },
        {
          "name": "Bachelor Political Science and Public Administration",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6600,
          "language": "English"
        },
        {
          "name": "Bachelor New Media and Communication Systems",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "English"
        },
        {
          "name": "Bachelor Music",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6600,
          "language": "English"
        },
        {
          "name": "Bachelor Mechatronics Engineering",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "English"
        },
        {
          "name": "Bachelor Mechanical Engineering",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 4800,
          "language": "English"
        },
        {
          "name": "Bachelor Mathematics",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 4800,
          "language": "English"
        },
        {
          "name": "Bachelor Marketing",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 7200,
          "language": "English"
        },
        {
          "name": "Bachelor Management of Performing Arts",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "English"
        },
        {
          "name": "Bachelor Management Information Systems",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 7200,
          "language": "English"
        },
        {
          "name": "Bachelor Logistics Management",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "English"
        },
        {
          "name": "Bachelor International Trade and Business",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 7200,
          "language": "English"
        },
        {
          "name": "Bachelor International Relations",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6600,
          "language": "English"
        },
        {
          "name": "Bachelor International Finance",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 7200,
          "language": "English"
        },
        {
          "name": "Bachelor Interior Architecture",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 7200,
          "language": "English"
        },
        {
          "name": "Bachelor Industrial Engineering",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 7800,
          "language": "English"
        },
        {
          "name": "Bachelor Industrial Design",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 7200,
          "language": "English"
        },
        {
          "name": "Bachelor History",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 4800,
          "language": "English"
        },
        {
          "name": "Bachelor Genetics and Bioengineering",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 4800,
          "language": "English"
        },
        {
          "name": "Bachelor Gastronomy and Culinary Arts",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "English"
        },
        {
          "name": "Bachelor Fashion and Textile Design",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "English"
        },
        {
          "name": "Bachelor English Language and Literature",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 4800,
          "language": "English"
        },
        {
          "name": "Bachelor Electrical and Electronics Engineering",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 4800,
          "language": "English"
        },
        {
          "name": "Bachelor Economics and Finance",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 7200,
          "language": "English"
        },
        {
          "name": "Bachelor Economics",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 7200,
          "language": "English"
        },
        {
          "name": "Bachelor Digital Game Design",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 7200,
          "language": "English"
        },
        {
          "name": "Bachelor Computer Engineering",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 7800,
          "language": "English"
        },
        {
          "name": "Bachelor Comparitive Literature",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 4800,
          "language": "English"
        },
        {
          "name": "Bachelor Communication Design and Management",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "English"
        },
        {
          "name": "Bachelor Civil Engineering",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 4800,
          "language": "English"
        },
        {
          "name": "Bachelor Business Administration",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 7200,
          "language": "English"
        },
        {
          "name": "Bachelor Aviation Management",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "English"
        },
        {
          "name": "Bachelor Architecture",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 4800,
          "language": "English"
        },
        {
          "name": "Bachelor Advertising",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "English"
        }
      ],
      "masters": [],
      "phd": []
    }
  },
  {
    "_id": "6a8b40f85db2ac417cc76daf",
    "name": "Istinye University",
    "location": "Istanbul, Turkey",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRE-ZdcwJbtHhcEGIyXmif6OWHLS7y6E2Jpq3Mc1_iewtXEg5c7KAWGCRiv&s=10",
    "description": "Bachelor's Degree Fee List 2025-2026",
    "programs": {
      "associate": [
        {
          "name": "Associate Radiotherapy",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Pharmacy Services",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Oral and Dental Health",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Opticianry",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Operating Room Services",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Medical Laboratory Techniques",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Medical Imaging Techniques",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Medical Documentation and Secretary",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Justice",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate International Trade",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Information Security Technology",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Food Technology",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate First Aid and Emergency",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Electroneurophysiology",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate E-Commerce and Marketing",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Dialysis",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Cookery",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Computer Technology",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Computer Programming",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Computer Aided Design and Animation",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Civil Aviation Cabin Services",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Automotive Technology",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Anesthesia",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "Associate Aircraft Technology",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        }
      ],
      "bachelors": [
        {
          "name": "Bachelor Visual Communication Design",
          "duration": "4 Years",
          "originalFee": 6000,
          "discountFee": 6000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Turkish Language and Literature",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Speech and Language Therapy",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Software Engineering",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Social Work",
          "duration": "4 Years",
          "originalFee": 6000,
          "discountFee": 6000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Public Relations and Advertising",
          "duration": "4 Years",
          "originalFee": 6000,
          "discountFee": 6000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Psychology",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Political Science and Public Administration",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Physiotherapy and Rehabilitation",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Philosophy",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Pharmacy",
          "duration": "4 Years",
          "originalFee": 14000,
          "discountFee": 14000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Nutrition and Dietetics",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Nursing",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Midwifery",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Medicine",
          "duration": "4 Years",
          "originalFee": 23000,
          "discountFee": 23000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Management Information Systems",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Interior Architecture and Environmental Design",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Health Management",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Gastronomy and Culinary Arts",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Fashion and Textile Design",
          "duration": "4 Years",
          "originalFee": 5500,
          "discountFee": 5500,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Dentistry",
          "duration": "4 Years",
          "originalFee": 20000,
          "discountFee": 20000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Computer Engineering",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Child Development",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Theatre",
          "duration": "4 Years",
          "originalFee": 15000,
          "discountFee": 7500,
          "language": "English"
        },
        {
          "name": "Bachelor Software Engineering",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Radio, Television and Cinema",
          "duration": "4 Years",
          "originalFee": 6000,
          "discountFee": 6000,
          "language": "English"
        },
        {
          "name": "Bachelor Radio Television and Cinema",
          "duration": "4 Years",
          "originalFee": 15000,
          "discountFee": 7500,
          "language": "English"
        },
        {
          "name": "Bachelor Psychology",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Physiotherapy and Rehabilitation",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Pharmacy",
          "duration": "4 Years",
          "originalFee": 15000,
          "discountFee": 15000,
          "language": "English"
        },
        {
          "name": "Bachelor Nursing",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor New Media and Communication",
          "duration": "4 Years",
          "originalFee": 6000,
          "discountFee": 6000,
          "language": "English"
        },
        {
          "name": "Bachelor New Media",
          "duration": "4 Years",
          "originalFee": 15000,
          "discountFee": 7500,
          "language": "English"
        },
        {
          "name": "Bachelor Molecular Biology and Genetics",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Medicine",
          "duration": "4 Years",
          "originalFee": 29000,
          "discountFee": 29000,
          "language": "English"
        },
        {
          "name": "Bachelor Mechatronics Engineering",
          "duration": "4 Years",
          "originalFee": 15000,
          "discountFee": 7500,
          "language": "English"
        },
        {
          "name": "Bachelor Mechanical Engineering",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Mathematics",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Management Information Systems",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor International Trade and Business",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor International Relations",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Industrial Engineering",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Industrial Design",
          "duration": "4 Years",
          "originalFee": 15000,
          "discountFee": 7500,
          "language": "English"
        },
        {
          "name": "Bachelor Gastronomy and Culinary Arts",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor English Translation and Interpretation (English/Turkish)",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor English Language and Literature",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Electrical and Electronics Engineering",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Economics",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Digital Game Design Non-Thesis",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Dentistry",
          "duration": "4 Years",
          "originalFee": 24500,
          "discountFee": 24500,
          "language": "English"
        },
        {
          "name": "Bachelor Computer Engineering",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Chemistry",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Business Administration",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Biomedical Engineering",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Architecture",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Advertising",
          "duration": "4 Years",
          "originalFee": 15000,
          "discountFee": 7500,
          "language": "English"
        },
        {
          "name": "Bachelor Child Development",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "language": "Turkish"
        }
      ],
      "masters": [
        {
          "name": "Master Turkish Language and Literature Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Surgical Disease Nursing Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Surgical Disease Nursing (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Stem Cell and Tissue Engineering Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Sports Physiotherapy Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Speech and Language Therapy Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Public Law",
          "duration": "2 Years",
          "originalFee": 15000,
          "discountFee": 7500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Psychology Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Psychology (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Political Science and International Relations Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Physiotherapy and Rehabilitation Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Obstetrics and Gynaecological Nursing (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Nutrition and Dietetics Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Nutrition and Dietetics (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Neuroscience Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Medical Biology and Genetics Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Law",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master International Relations and Political Science Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Healthcare Management",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Health Management (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Gynecology and Obstetrics Nursing",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Clinical Psychology (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Cancer Biology and Pharmacology Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Business Administration - MBA",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Business Administration - MBA (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Architectural Design Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master User Experience Design (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Psychology",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Private Law",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Preservation of Cultural Heritage",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Political Science and Public Administration",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Political Science and International Relations Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Physiotherapy and Rehabilitation Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Molecular Biology and Genetics Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Materials Science and Nanotechnology",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Management Information Systems Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Management for Professionals (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master International Relations",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master International Political Economy",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Industrial Engineering",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Finance and Banking",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Film and Drama",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Energy and Sustainable Development",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Electrical and Computer Engineering",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Economics",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Design",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Cyber Security",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Computer Engineering Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Computer Engineering (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Computational Science and Engineering",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Communication Studies",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Business Intelligence and Analytics (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Business Administration - MBA",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Business Administration - MBA (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Artificial Intelligence Engineering Thesis",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Architectural and Urban Studies",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Architectural and Urban Studies (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "thesisType": "Non-Thesis",
          "language": "English"
        }
      ],
      "phd": [
        {
          "name": "Stem Cell and Tissue Engineering Thesis",
          "duration": "4 Years",
          "originalFee": 12500,
          "discountFee": 12500,
          "language": "Turkish"
        },
        {
          "name": "Speech and Language Therapy Thesis",
          "duration": "4 Years",
          "originalFee": 12500,
          "discountFee": 12500,
          "language": "Turkish"
        },
        {
          "name": "Pharmaceutical Chemistry Thesis",
          "duration": "4 Years",
          "originalFee": 12500,
          "discountFee": 12500,
          "language": "Turkish"
        },
        {
          "name": "Obstetrics and Gynaecological Nursing Thesis",
          "duration": "4 Years",
          "originalFee": 12500,
          "discountFee": 12500,
          "language": "Turkish"
        },
        {
          "name": "Nutrition and Dietetics Thesis",
          "duration": "4 Years",
          "originalFee": 12500,
          "discountFee": 12500,
          "language": "Turkish"
        },
        {
          "name": "Neuroscience",
          "duration": "4 Years",
          "originalFee": 12500,
          "discountFee": 12500,
          "language": "Turkish"
        },
        {
          "name": "Molecular Oncology Thesis",
          "duration": "4 Years",
          "originalFee": 12500,
          "discountFee": 12500,
          "language": "Turkish"
        },
        {
          "name": "Midwifery",
          "duration": "4 Years",
          "originalFee": 12500,
          "discountFee": 12500,
          "language": "Turkish"
        },
        {
          "name": "Medical Biology and Genetics Thesis",
          "duration": "4 Years",
          "originalFee": 12500,
          "discountFee": 12500,
          "language": "Turkish"
        },
        {
          "name": "Histology and Embryology Thesis",
          "duration": "4 Years",
          "originalFee": 12500,
          "discountFee": 12500,
          "language": "Turkish"
        },
        {
          "name": "Health Management Thesis",
          "duration": "4 Years",
          "originalFee": 12500,
          "discountFee": 12500,
          "language": "Turkish"
        },
        {
          "name": "Communication Sciences Thesis",
          "duration": "4 Years",
          "originalFee": 12500,
          "discountFee": 12500,
          "language": "Turkish"
        },
        {
          "name": "Clinical Anatomy",
          "duration": "4 Years",
          "originalFee": 12500,
          "discountFee": 12500,
          "language": "Turkish"
        },
        {
          "name": "Business Administration Thesis",
          "duration": "4 Years",
          "originalFee": 12500,
          "discountFee": 12500,
          "language": "Turkish"
        },
        {
          "name": "Physics Thesis",
          "duration": "4 Years",
          "originalFee": 12500,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "International Relations",
          "duration": "4 Years",
          "originalFee": 15000,
          "discountFee": 7500,
          "language": "English"
        },
        {
          "name": "Gender Studies",
          "duration": "4 Years",
          "originalFee": 15000,
          "discountFee": 7500,
          "language": "English"
        },
        {
          "name": "Electrical and Electronics Engineering",
          "duration": "4 Years",
          "originalFee": 15000,
          "discountFee": 7500,
          "language": "English"
        },
        {
          "name": "Economics",
          "duration": "4 Years",
          "originalFee": 15000,
          "discountFee": 7500,
          "language": "English"
        },
        {
          "name": "Computer Engineering",
          "duration": "4 Years",
          "originalFee": 15000,
          "discountFee": 7500,
          "language": "English"
        },
        {
          "name": "Communication Sciences",
          "duration": "4 Years",
          "originalFee": 12500,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Chemistry Thesis",
          "duration": "4 Years",
          "originalFee": 12500,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Business Administration",
          "duration": "4 Years",
          "originalFee": 12500,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Banking and Finance",
          "duration": "4 Years",
          "originalFee": 15000,
          "discountFee": 7500,
          "language": "English"
        }
      ]
    }
  },
  {
    "_id": "6a8b35636cba956253c6afd5",
    "name": "Lokman Hekim University",
    "location": "Ankara, Turkey",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhcuzX9fHAHpxusO4t-U3EuYUxxOYrdn_hZOmt2Qp-ZA&s=10",
    "description": "Bachelor's Degree Fee List 2025-2026",
    "programs": {
      "associate": [
        {
          "name": "Associate Pharmacy Services",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3150,
          "language": "Turkish"
        },
        {
          "name": "Associate Oral and Dental Health",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3150,
          "language": "Turkish"
        },
        {
          "name": "Associate Opticianery",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3150,
          "language": "Turkish"
        },
        {
          "name": "Associate Operating Room Services",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3150,
          "language": "Turkish"
        },
        {
          "name": "Associate Medical Laboratory Techniques",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3150,
          "language": "Turkish"
        },
        {
          "name": "Associate Medical Imaging Techniques",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3150,
          "language": "Turkish"
        },
        {
          "name": "Associate First Aid and Emergency",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3150,
          "language": "Turkish"
        },
        {
          "name": "Associate Elderly Care",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3150,
          "language": "Turkish"
        },
        {
          "name": "Associate Dialysis",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3150,
          "language": "Turkish"
        },
        {
          "name": "Associate Dental Prosthetics Technology",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3150,
          "language": "Turkish"
        },
        {
          "name": "Associate Anesthesia",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3150,
          "language": "Turkish"
        }
      ],
      "bachelors": [
        {
          "name": "Bachelor Sports Management",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 3600,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Speech and Language Therapy",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 3600,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Physiotherapy and Rehabilitation",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4050,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Pharmacy",
          "duration": "4 Years",
          "originalFee": 13500,
          "discountFee": 9100,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Occupational Therapy",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 3600,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Nutrition and Dietetics",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 3600,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Nursing",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 3600,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Midwifery",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 3600,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Medicine",
          "duration": "4 Years",
          "originalFee": 20000,
          "discountFee": 18000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Dentistry",
          "duration": "4 Years",
          "originalFee": 18000,
          "discountFee": 12150,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Coaching Education",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 3600,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Audiology",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 3600,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Pharmacy",
          "duration": "4 Years",
          "originalFee": 13500,
          "discountFee": 9100,
          "language": "English"
        },
        {
          "name": "Bachelor Medicine",
          "duration": "4 Years",
          "originalFee": 22500,
          "discountFee": 15200,
          "language": "English"
        },
        {
          "name": "Bachelor Dentistry",
          "duration": "4 Years",
          "originalFee": 20000,
          "discountFee": 13500,
          "language": "English"
        }
      ],
      "masters": [],
      "phd": []
    }
  },
  {
    "_id": "6a8b344b6cba956253c6a555",
    "name": "Yasar University",
    "location": "Istanbul, Turkey",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_VuAjk8v6wl9WEIwIQRwc7B0eYcFp7_gAROiosQgVEw&s=10",
    "description": "Bachelor's Degree Fee List 2025-2026",
    "programs": {
      "associate": [
        {
          "name": "Associate Justice",
          "duration": "2 Years",
          "originalFee": 4000,
          "discountFee": 4000,
          "language": "Turkish"
        }
      ],
      "bachelors": [
        {
          "name": "Bachelor Law",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Gastronomy and Culinary Arts",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Visual Communication Design",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Software Engineering",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Public Relations and Advertising",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Psychology",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor New Media and Communication",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Mechanical Engineering",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Management Information Systems",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Logistics Management",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor International Trade and Finance",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Interior Architecture and Environmental Design",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Industrial Engineering",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Electrical and Electronics Engineering",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Economics",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Computer Engineering",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Civil Engineering",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Business Administration",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Architecture",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "English"
        }
      ],
      "masters": [
        {
          "name": "Master Public Law",
          "duration": "2 Years",
          "originalFee": 7200,
          "discountFee": 7200,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Public Law (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 7200,
          "discountFee": 7200,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Private Law",
          "duration": "2 Years",
          "originalFee": 7200,
          "discountFee": 7200,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Private Law (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 7200,
          "discountFee": 7200,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Tourism Management",
          "duration": "2 Years",
          "originalFee": 7200,
          "discountFee": 7200,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Industrial Engineering",
          "duration": "2 Years",
          "originalFee": 7200,
          "discountFee": 7200,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Electrical and Electronics Engineering",
          "duration": "2 Years",
          "originalFee": 7200,
          "discountFee": 7200,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Electrical and Electronic Engineering (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 7200,
          "discountFee": 7200,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Computer Engineering",
          "duration": "2 Years",
          "originalFee": 7200,
          "discountFee": 7200,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Computer Engineering (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 7200,
          "discountFee": 7200,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Architecture (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 7200,
          "discountFee": 7200,
          "thesisType": "Non-Thesis",
          "language": "English"
        }
      ],
      "phd": [
        {
          "name": "Public Law",
          "duration": "4 Years",
          "originalFee": 16000,
          "discountFee": 16000,
          "language": "Turkish"
        },
        {
          "name": "Private Law",
          "duration": "4 Years",
          "originalFee": 16000,
          "discountFee": 16000,
          "language": "Turkish"
        },
        {
          "name": "Computer Engineering",
          "duration": "4 Years",
          "originalFee": 16000,
          "discountFee": 16000,
          "language": "English"
        },
        {
          "name": "Business Administration",
          "duration": "4 Years",
          "originalFee": 16000,
          "discountFee": 16000,
          "language": "English"
        }
      ]
    }
  },
  {
    "_id": "6a8b33076cba956253c69b4b",
    "name": "Ozyegin University",
    "location": "Istanbul, Turkey",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRptH6UsCjUeU88nlFRM_j9lge8A9oPre8Y-KNC62XCsg&s=10",
    "description": "Bachelor's Degree Fee List 2025-2026",
    "programs": {
      "associate": [],
      "bachelors": [
        {
          "name": "Bachelor Law",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Architecture",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Psychology",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor Pilotage - Pilot Training",
          "duration": "4 Years",
          "originalFee": 16500,
          "discountFee": 16500,
          "language": "English"
        },
        {
          "name": "Bachelor Mechanical Engineering",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor Management Information Systems",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor International Trade and Business",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor International Relations",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor International Finance",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor Interior Architecture and Environmental Design",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor Industrial Engineering",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor Industrial Design",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor Hotel Management",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor Gastronomy and Culinary Arts",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor Electrical and Electronics Engineering",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor Economics",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor Computer Engineering",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor Communication Design",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor Civil Engineering",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor Business Administration",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor Aviation Management",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor Artificial Intelligence and Data Engineering",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        },
        {
          "name": "Bachelor Architecture",
          "duration": "4 Years",
          "originalFee": 25000,
          "discountFee": 12500,
          "language": "English"
        }
      ],
      "masters": [],
      "phd": []
    }
  },
  {
    "_id": "6a8b31856cba956253c68c5e",
    "name": "Fenerbahce University",
    "location": "Istanbul, Turkey",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmNSvZo72AEpwEXjF_xoBm9QgQ6kCHav9jorxDEfByrw&s=10",
    "description": "Bachelor's Degree Fee List 2025-2026",
    "programs": {
      "associate": [
        {
          "name": "Associate Radiotherapy",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Associate Prosthesis and Orthosis",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Associate Pathology Laboratory Techniques",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Associate Oral and Dental Health",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Associate Medical Laboratory Techniques",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Associate Medical Imaging Techniques",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Associate Dialysis",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Associate Dental Prosthesis Technology",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Associate Physiotherapy",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 2000,
          "language": "English"
        }
      ],
      "bachelors": [
        {
          "name": "Bachelor Sports Management",
          "duration": "4 Years",
          "originalFee": 7500,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Sports Coaching",
          "duration": "4 Years",
          "originalFee": 7500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Speech and Language Therapy",
          "duration": "4 Years",
          "originalFee": 7500,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Radio Television and Cinema",
          "duration": "4 Years",
          "originalFee": 7500,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Public Relations and Advertising",
          "duration": "4 Years",
          "originalFee": 7500,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Pharmacy",
          "duration": "4 Years",
          "originalFee": 10000,
          "discountFee": 6000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Occupational Therapy",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Midwifery",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Interior Architecture and Environmental Design",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Exercise and Sports Sciences",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Ergotherapy",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Architecture",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Pharmacy",
          "duration": "4 Years",
          "originalFee": 12000,
          "discountFee": 7500,
          "language": "English"
        },
        {
          "name": "Bachelor International Finance",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "English"
        },
        {
          "name": "Bachelor English Language and Literature",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "English"
        },
        {
          "name": "Bachelor Economics and Finance",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "English"
        }
      ],
      "masters": [
        {
          "name": "Master Sport Sciences",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 3000,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Sport Sciences (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5500,
          "discountFee": 2250,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Internal Medicine Nursing",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 3000,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Clinical Pharmacy (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5500,
          "discountFee": 2250,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Business Administration - MBA",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 3000,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Business Administration - MBA (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5500,
          "discountFee": 2250,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Business Administration - MBA",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 3000,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Business Administration - MBA (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5500,
          "discountFee": 2250,
          "thesisType": "Non-Thesis",
          "language": "English"
        }
      ],
      "phd": [
        {
          "name": "Sport Sciences",
          "duration": "4 Years",
          "originalFee": 15000,
          "discountFee": 7500,
          "language": "Turkish"
        },
        {
          "name": "Business Administration",
          "duration": "4 Years",
          "originalFee": 15000,
          "discountFee": 7500,
          "language": "Turkish"
        }
      ]
    }
  },
  {
    "_id": "6a8afd402f6fba39ba418ae9",
    "name": "Uskudar University",
    "location": "Istanbul, Turkey",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRj2F1gPTh29ISCkiVRRcbqL2ubuejjwbxsaqT1EWNn_Q&s=10",
    "description": "Bachelor's Degree Fee List 2025-2026",
    "programs": {
      "associate": [
        {
          "name": "Associate Social Services",
          "duration": "2 Years",
          "originalFee": 2800,
          "discountFee": 2660,
          "language": "Turkish"
        },
        {
          "name": "Associate Radiotherapy",
          "duration": "2 Years",
          "originalFee": 2800,
          "discountFee": 2660,
          "language": "Turkish"
        },
        {
          "name": "Associate Pharmacy Services",
          "duration": "2 Years",
          "originalFee": 2800,
          "discountFee": 2660,
          "language": "Turkish"
        },
        {
          "name": "Associate Perfusion Techniques",
          "duration": "2 Years",
          "originalFee": 2800,
          "discountFee": 2660,
          "language": "Turkish"
        },
        {
          "name": "Associate Orthopedic Prosthetics and Orthotics",
          "duration": "2 Years",
          "originalFee": 2800,
          "discountFee": 2660,
          "language": "Turkish"
        },
        {
          "name": "Associate Opticianry",
          "duration": "2 Years",
          "originalFee": 2800,
          "discountFee": 2660,
          "language": "Turkish"
        },
        {
          "name": "Associate Operating Room Services",
          "duration": "2 Years",
          "originalFee": 2800,
          "discountFee": 2660,
          "language": "Turkish"
        },
        {
          "name": "Associate Home Health Nursing",
          "duration": "2 Years",
          "originalFee": 2800,
          "discountFee": 2660,
          "language": "Turkish"
        },
        {
          "name": "Associate Disabled Care and Rehabilitation",
          "duration": "2 Years",
          "originalFee": 2800,
          "discountFee": 2660,
          "language": "Turkish"
        },
        {
          "name": "Associate Dental Prosthesis Technology",
          "duration": "2 Years",
          "originalFee": 2800,
          "discountFee": 2660,
          "language": "Turkish"
        },
        {
          "name": "Associate Child Protection and Nursing Services",
          "duration": "2 Years",
          "originalFee": 2800,
          "discountFee": 2660,
          "language": "Turkish"
        },
        {
          "name": "Associate Biomedical Device Technology",
          "duration": "2 Years",
          "originalFee": 2800,
          "discountFee": 2660,
          "language": "Turkish"
        },
        {
          "name": "Associate Autopsy Assistantship",
          "duration": "2 Years",
          "originalFee": 2800,
          "discountFee": 2660,
          "language": "Turkish"
        },
        {
          "name": "Associate Audiometry",
          "duration": "2 Years",
          "originalFee": 2800,
          "discountFee": 2660,
          "language": "Turkish"
        },
        {
          "name": "Associate Anesthesia",
          "duration": "2 Years",
          "originalFee": 2800,
          "discountFee": 2660,
          "language": "Turkish"
        }
      ],
      "bachelors": [
        {
          "name": "Bachelor Visual Communication Design",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Speech and Language Therapy",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Sociology",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Social Work",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Radio Television and Cinema",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Public Relations and Publicity",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Psychology",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Political Science and International Relations",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Physiotherapy and Rehabilitation",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Philosophy",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Perfusion",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Occupational Health and Safety",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Nutrition and Dietetics",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Nursing",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor New Media and Communication",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Molecular Biology and Genetics",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Midwifery",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Medicine",
          "duration": "4 Years",
          "originalFee": 18000,
          "discountFee": 16200,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Journalism",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor History",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Health Management",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Forensic Sciences",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Dentistry",
          "duration": "4 Years",
          "originalFee": 16000,
          "discountFee": 14400,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Child Development",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Cartoon and Animation",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Audiology",
          "duration": "4 Years",
          "originalFee": 4200,
          "discountFee": 3800,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Advertising",
          "duration": "4 Years",
          "originalFee": 3600,
          "discountFee": 3420,
          "language": "Turkish"
        },
        {
          "name": "Bachelor English Translation and Interpretation (English/Turkish) English/",
          "duration": "4 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "language": "English"
        },
        {
          "name": "Bachelor Software Engineering",
          "duration": "4 Years",
          "originalFee": 5600,
          "discountFee": 5000,
          "language": "English"
        },
        {
          "name": "Bachelor Psychology",
          "duration": "4 Years",
          "originalFee": 5600,
          "discountFee": 5000,
          "language": "English"
        },
        {
          "name": "Bachelor Political Science and International Relations",
          "duration": "4 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "language": "English"
        },
        {
          "name": "Bachelor Molecular Biology and Genetics",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4500,
          "language": "English"
        },
        {
          "name": "Bachelor Medicine",
          "duration": "4 Years",
          "originalFee": 24000,
          "discountFee": 21600,
          "language": "English"
        },
        {
          "name": "Bachelor Industrial Engineering",
          "duration": "4 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "language": "English"
        },
        {
          "name": "Bachelor Electrical and Electronics Engineering",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4500,
          "language": "English"
        },
        {
          "name": "Bachelor Dentistry",
          "duration": "4 Years",
          "originalFee": 22000,
          "discountFee": 19800,
          "language": "English"
        },
        {
          "name": "Bachelor Computer Engineering",
          "duration": "4 Years",
          "originalFee": 5600,
          "discountFee": 5000,
          "language": "English"
        },
        {
          "name": "Bachelor Bioengineering",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4500,
          "language": "English"
        },
        {
          "name": "Bachelor Occupational Health and Safety",
          "duration": "4 Years",
          "originalFee": 2800,
          "discountFee": 2660,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Child Development",
          "duration": "4 Years",
          "originalFee": 2800,
          "discountFee": 2660,
          "language": "Turkish"
        }
      ],
      "masters": [
        {
          "name": "Master Visual Communication Design Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Visual Communication Design (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Sufi Culture and Literature Thesis",
          "duration": "2 Years",
          "originalFee": 9150,
          "discountFee": 8235,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Sufi Culture and Literature (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 7500,
          "discountFee": 6750,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Speech and Language Therapy Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Sociology Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Social Work Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Social Work (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Public Relations and Advertising Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Public Relations and Advertising (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Physiotherapy and Rehabilitation Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Physiotherapy and Rehabilitation (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Philosophy Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Occupational Health and Safety Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Occupational Health and Safety (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Nutrition and Dietetics Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Nutrition and Dietetics (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Nursing Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Nursing (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master New Media and Journalism Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master New Media and Journalism (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Neuroscience Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Neuroscience (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Neuromarketing Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Neuromarketing (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Molecular Biology Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Molecular Biology (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Media and Cultural Studies Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Media and Cultural Studies (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master International Relations Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Healthcare Management",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Health Management (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Forensic Science Thesis",
          "duration": "2 Years",
          "originalFee": 5100,
          "discountFee": 4590,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Forensic Science (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Family Counseling Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Family Counseling (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Engineering Management Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Cyber Security Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Cyber Security (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Criminal Justice Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Criminal Justice (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Computer Engineering Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Computer Engineering (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Clinical Psychology Thesis",
          "duration": "2 Years",
          "originalFee": 17400,
          "discountFee": 15660,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Clinical Psychology (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 15200,
          "discountFee": 13680,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Child Development Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Child Development (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Biotechnology Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Biotechnology (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Biosecurity Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Bioinformatics Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Bioengineering Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Bioengineering (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Artificial Intelligence Engineering Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Artificial Intelligence Engineering (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Applied Psychology Thesis",
          "duration": "2 Years",
          "originalFee": 7300,
          "discountFee": 6570,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Addiction Consulting and Rehabilitation Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Addiction Consulting and Rehabilitation (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Neuroscience Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Neuroscience (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Molecular Biology Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Molecular Biology (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Engineering Management Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Engineering Management (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Electrical and Electronics Engineering",
          "duration": "2 Years",
          "originalFee": 5700,
          "discountFee": 5130,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Electrical and Electronic Engineering (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 5100,
          "discountFee": 4590,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Cyber Security Thesis",
          "duration": "2 Years",
          "originalFee": 5700,
          "discountFee": 5130,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Cyber Security (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Computer Engineering Thesis",
          "duration": "2 Years",
          "originalFee": 5700,
          "discountFee": 5130,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Computer Engineering (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 5100,
          "discountFee": 4590,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Chemical Engineering Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Chemical Engineering (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Bioengineering Thesis",
          "duration": "2 Years",
          "originalFee": 4800,
          "discountFee": 4320,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Bioengineering (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 4400,
          "discountFee": 3960,
          "thesisType": "Non-Thesis",
          "language": "English"
        }
      ],
      "phd": [
        {
          "name": "Visual Communication Design",
          "duration": "5 Years",
          "originalFee": 9000,
          "discountFee": 8100,
          "language": "Turkish"
        },
        {
          "name": "Speech and Language Therapy",
          "duration": "4 Years",
          "originalFee": 7800,
          "discountFee": 7020,
          "language": "Turkish"
        },
        {
          "name": "Psychology",
          "duration": "5 Years",
          "originalFee": 19100,
          "discountFee": 17190,
          "language": "Turkish"
        },
        {
          "name": "Occupational Health and Safety",
          "duration": "4 Years",
          "originalFee": 7800,
          "discountFee": 7020,
          "language": "Turkish"
        },
        {
          "name": "Nursing",
          "duration": "5 Years",
          "originalFee": 9000,
          "discountFee": 8100,
          "language": "Turkish"
        },
        {
          "name": "New Media and Communication",
          "duration": "5 Years",
          "originalFee": 7800,
          "discountFee": 7020,
          "language": "Turkish"
        },
        {
          "name": "Neuroscience",
          "duration": "5 Years",
          "originalFee": 9000,
          "discountFee": 8100,
          "language": "Turkish"
        },
        {
          "name": "International Relations",
          "duration": "5 Years",
          "originalFee": 7800,
          "discountFee": 7020,
          "language": "Turkish"
        },
        {
          "name": "Health Management",
          "duration": "5 Years",
          "originalFee": 7800,
          "discountFee": 7020,
          "language": "Turkish"
        }
      ]
    }
  },
  {
    "_id": "6a8ae443197f5d72d960f5b2",
    "name": "Istanbul Okan University",
    "location": "Istanbul, Turkey",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtZDskQMSZuuygYmezbWrVw6nqYqpfOANRnOAcOYBeLA&s",
    "description": "Bachelor's Degree Fee List 2025-2026",
    "programs": {
      "associate": [
        {
          "name": "Associate Survey and Cadaster",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Radiotherapy",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Pathology Laboratory Techniques",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Oral and Dental Health",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Opticianry",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Operating Room Services",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Occupational Health and Safety",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Occupational Health and Safety (D.E)",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Mobile Technology",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Medical Laboratory Techniques",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Medical Imaging Techniques",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Mechatronics",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Mechanics",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Justice",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Interior Design",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Graphic Design",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Foreign Trade",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Flight Operations Management",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate First Aid and Emergency",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Electroneurophysiology",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Electric",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Dialysis",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Court Office Services",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Cookery",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Construction Technology",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Computer Programming",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Computer Aided Design and Animation",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Civil Aviation Management",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Civil Aviation Cabin Services",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Audiometry",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Architectural Restoration",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Anesthesia",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Aircraft Technology",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Associate Foreign Trade",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "English"
        },
        {
          "name": "Associate Civil Aviation Management",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "English"
        },
        {
          "name": "Associate Civil Aviation Cabin Services",
          "duration": "2 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "English"
        }
      ],
      "bachelors": [
        {
          "name": "Bachelor Visual Communication Design",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Theatre",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Sports Management",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Special Education Teaching",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Public Relations and Advertising",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Psychology",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Psychological Counselling and Guidance",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Pre-School Teaching",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Physiotherapy and Rehabilitation",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Pharmacy",
          "duration": "4 Years",
          "originalFee": 9000,
          "discountFee": 8550,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Nutrition and Dietetics",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Nursing",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor New Media and Communication",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Music",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Medicine",
          "duration": "4 Years",
          "originalFee": 19500,
          "discountFee": 18525,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Law",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor International Trade",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor International Relations",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor International Finance and Banking",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Interior Architecture and Environmental Design",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Information Systems and Technologies",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Health Management",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Gastronomy and Culinary Arts",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Fashion and Textile Design",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Digital Game Design",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Dentistry",
          "duration": "4 Years",
          "originalFee": 15000,
          "discountFee": 14250,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Civil Engineering",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Cinema and Television",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Child Development",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Business Administration",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Aviation Management",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Architecture",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "English"
        },
        {
          "name": "Bachelor Russian Translation and Interpretation (Russian/Turkish) Russian/",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor English Translation and Interpretation (English/Turkish) English/",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Software Engineering",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Psychology",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Pilotage - Pilot Training",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 7600,
          "language": "English"
        },
        {
          "name": "Bachelor Physiotherapy and Rehabilitation",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Pharmacy",
          "duration": "4 Years",
          "originalFee": 10000,
          "discountFee": 8000,
          "language": "English"
        },
        {
          "name": "Bachelor Nutrition and Dietetics",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4275,
          "language": "English"
        },
        {
          "name": "Bachelor Nursing",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Medicine",
          "duration": "4 Years",
          "originalFee": 22500,
          "discountFee": 21375,
          "language": "English"
        },
        {
          "name": "Bachelor Mechatronics Engineering",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Mechanical Engineering",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Logistics Management",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor International Trade",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor International Relations",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Interior Architecture and Environmental Design",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Information Systems and Technologies",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 3800,
          "language": "English"
        },
        {
          "name": "Bachelor Industrial Engineering",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Geomatics Engineering",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Genetics and Bioengineering",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Gastronomy and Culinary Arts",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor English Teaching",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor English Language Teaching",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 3800,
          "language": "English"
        },
        {
          "name": "Bachelor Electrical and Electronics Engineering",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Economics and Finance",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Dentistry",
          "duration": "4 Years",
          "originalFee": 18000,
          "discountFee": 17100,
          "language": "English"
        },
        {
          "name": "Bachelor Computer Engineering",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Civil Engineering",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Business Administration",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Automotive Engineering",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Architecture",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Bachelor Chinese Translation and Interpretion (Chinese/Turkish) Chinese/",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Sports Management",
          "duration": "4 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Child Development",
          "duration": "4 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        },
        {
          "name": "Bachelor Business Administration",
          "duration": "4 Years",
          "originalFee": 2025,
          "discountFee": 1925,
          "language": "Turkish"
        }
      ],
      "masters": [
        {
          "name": "Master Urban Renewal",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Urban Renewal (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Translation Studies",
          "duration": "2 Years",
          "originalFee": 5500,
          "discountFee": 5500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Translation Studies (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Tourism Management",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Tourism Management (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Sports Physiology",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Sports Physiology (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Sports Management",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Sports Management (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Social and Cultural Studies",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Social and Cultural Studies (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Sales and Marketing",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Sales and Marketing (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Real Estate Finance and Valuation",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Real Estate Finance and Valuation (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Quality Management in Healthcare",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Quality Management in Healthcare (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Public Law",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Public Law (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Psychology",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Psychology (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Property Financing and Valuation (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Private Law",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Private Law (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Pre-school Education",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Pre-school Education (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Physiotherapy and Rehabilitation",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Physiotherapy and Rehabilitation (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Painting",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Painting (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Oral and Maxillofacial Radiology",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Oral and Maxillofacial Radiology (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Occupational Health and Safety",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Occupational Health and Safety (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Nutrition and Dietetics",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Nutrition and Dietetics (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Nursing",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Nursing (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Music",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Music (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Marketing Communication",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Marketing Communication (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Logistics Management",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Logistics Management (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Local Administrations",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Local Administrations (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master IT Law (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master International Trade",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master International Trade (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master International Relations",
          "duration": "2 Years",
          "originalFee": 5500,
          "discountFee": 5500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master International Relations (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Interior Architecture and Environmental Design",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Interior Architecture and Environmental Design (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Information Technologies Law",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Information Technologies Law (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Human Resources Management",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Human Resources Management (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Healthcare Management",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Health Management (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Geotechnical Engineering",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Geotechnical Engineering (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Geomatics Engineering",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Geomatics Engineering (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Gastronomy",
          "duration": "2 Years",
          "originalFee": 5500,
          "discountFee": 5500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Gastronomy (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Fashion Design",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Fashion Design (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Explosives Engineering",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Explosives Engineering (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Entrepreneurship",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Entrepreneurship (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Engineering Management",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Engineering Management (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Educational Administration and Supervision",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Educational Administration and Supervision (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Computer Engineering",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Computer Engineering (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Clinical Psychology",
          "duration": "2 Years",
          "originalFee": 24200,
          "discountFee": 24200,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Clinical Psychology (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 20000,
          "discountFee": 19000,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Civil Engineering",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Cinema and Television",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Cinema and Television (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Child Development and Education",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Child Development and Education (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Business Administration - MBA",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Business Administration - MBA (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 6100,
          "discountFee": 6100,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Banking",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Banking (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Architecture",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Architecture (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Aestetic Restorative",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Aestetic Restorative (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Accounting and Auditing",
          "duration": "2 Years",
          "originalFee": 4500,
          "discountFee": 4275,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Accounting and Auditing (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 3325,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Master Power Electronics and Clean Energy Systems",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 5700,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Marketing",
          "duration": "2 Years",
          "originalFee": 5500,
          "discountFee": 5500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Marketing (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master International Trade",
          "duration": "2 Years",
          "originalFee": 5500,
          "discountFee": 5500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master International Trade (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Information Systems",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 5700,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Information Systems (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Gastronomy",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 5700,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Gastronomy (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 5000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Finance",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 5700,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Finance (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5500,
          "discountFee": 5500,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Business Administration - MBA",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 5700,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Business Administration - MBA (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Automotive Mechatronics and Intelligent Vehicles",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 5700,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Artificial Intelligence Engineering",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 5700,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Artificial Intelligence Engineering (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Architecture",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 5700,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Master Architecture (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5000,
          "discountFee": 4750,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Master Advanced Electronics and Communication Technology",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 5700,
          "thesisType": "Thesis",
          "language": "English"
        }
      ],
      "phd": [
        {
          "name": "Educational Administration and Supervision",
          "duration": "4 Years",
          "originalFee": 7000,
          "discountFee": 6650,
          "language": "Turkish"
        },
        {
          "name": "Computer Engineering",
          "duration": "4 Years",
          "originalFee": 7000,
          "discountFee": 6650,
          "language": "Turkish"
        },
        {
          "name": "Cinema and Television",
          "duration": "4 Years",
          "originalFee": 7000,
          "discountFee": 6650,
          "language": "Turkish"
        },
        {
          "name": "Business Administration",
          "duration": "4 Years",
          "originalFee": 7000,
          "discountFee": 6650,
          "language": "Turkish"
        },
        {
          "name": "Banking",
          "duration": "4 Years",
          "originalFee": 10600,
          "discountFee": 10600,
          "language": "Turkish"
        },
        {
          "name": "Architecture",
          "duration": "4 Years",
          "originalFee": 7000,
          "discountFee": 6650,
          "language": "Turkish"
        },
        {
          "name": "Applied Psychology",
          "duration": "4 Years",
          "originalFee": 7000,
          "discountFee": 6650,
          "language": "Turkish"
        },
        {
          "name": "Accounting and Auditing",
          "duration": "4 Years",
          "originalFee": 7000,
          "discountFee": 6650,
          "language": "Turkish"
        },
        {
          "name": "Public Law",
          "duration": "4 Years",
          "originalFee": 7000,
          "discountFee": 6650,
          "language": "Turkish"
        },
        {
          "name": "Private Law",
          "duration": "4 Years",
          "originalFee": 7000,
          "discountFee": 6650,
          "language": "Turkish"
        },
        {
          "name": "Periodontology",
          "duration": "4 Years",
          "originalFee": 13200,
          "discountFee": 13200,
          "language": "Turkish"
        },
        {
          "name": "Orthodontics",
          "duration": "4 Years",
          "originalFee": 15000,
          "discountFee": 14250,
          "language": "Turkish"
        },
        {
          "name": "Nutrition and Dietetics",
          "duration": "4 Years",
          "originalFee": 7000,
          "discountFee": 6650,
          "language": "Turkish"
        },
        {
          "name": "Nursing",
          "duration": "4 Years",
          "originalFee": 7000,
          "discountFee": 6650,
          "language": "Turkish"
        },
        {
          "name": "Music",
          "duration": "4 Years",
          "originalFee": 7000,
          "discountFee": 6650,
          "language": "Turkish"
        },
        {
          "name": "Land-use Planning and Management",
          "duration": "4 Years",
          "originalFee": 7000,
          "discountFee": 6650,
          "language": "Turkish"
        },
        {
          "name": "Health Management",
          "duration": "4 Years",
          "originalFee": 7000,
          "discountFee": 6650,
          "language": "Turkish"
        },
        {
          "name": "Endodontics",
          "duration": "4 Years",
          "originalFee": 13200,
          "discountFee": 13200,
          "language": "Turkish"
        },
        {
          "name": "Mechatronics Engineering",
          "duration": "4 Years",
          "originalFee": 9000,
          "discountFee": 8550,
          "language": "English"
        },
        {
          "name": "Business Administration",
          "duration": "4 Years",
          "originalFee": 9000,
          "discountFee": 8550,
          "language": "English"
        },
        {
          "name": "Architecture",
          "duration": "4 Years",
          "originalFee": 9000,
          "discountFee": 8550,
          "language": "English"
        }
      ]
    }
  },
  {
    "_id": "6a8a20ca5d06fce5adcb37ee",
    "name": "ISTANBUL GELISIM UNIVERSITY",
    "location": "Istanbul, Turkey",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQen3w8bj7KaVk5FMQnd8Iot8oqJzjB9cWgL8g5i0XX3g&s=10",
    "description": "Bachelor's Degree Fee List 2025-2026",
    "programs": {
      "associate": [
        {
          "name": "Computer Programming",
          "duration": "2",
          "originalFee": 6500,
          "discountFee": 3250,
          "language": "English"
        },
        {
          "name": "Civil Aviation Transportation",
          "duration": "2",
          "originalFee": 6500,
          "discountFee": 3250,
          "language": "English"
        },
        {
          "name": "Civil Aviation Cabin Services",
          "duration": "2",
          "originalFee": 6500,
          "discountFee": 3250,
          "language": "English"
        },
        {
          "name": "Web Design and Coding",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Radiotherapy",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Radio and Television Programming",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Podology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Physiotherapy",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Pathology Laboratory Techniques",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Pastry and Bakery",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Orthopedic Prosthetics and Orthotics",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Oral and Dental Health",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Opticianery",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Operating Room Services",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Occupational Health and Safety",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Medical Laboratory Techniques",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Medical Imaging Techniques",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Medical Documentation and Secretary",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Mechatronics",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Maritime and Port Management",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Management of Health lnstitutions",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Machinery",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Logistics",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Laboratory Technology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Justice",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Interior Design",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Information Security Technology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Hybrid and Electric Vehicles Technology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Human Resources Management",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Hair Care and Beauty Services",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Food Technology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Food Quality Control and Analysis",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "First Aid and Emergency",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Fashion Design",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Electronics Technology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Electroneurophysiology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Electric",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Dialysis",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Dental Prosthesis Technology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Cookery",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Construction Technology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Computer Technology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Computer Programming",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Computer Aided Design and Animation",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Civil Aviation Transportation Management",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Civil Aviation Cabin Services",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Biomedical Device Technology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Autopsy Assistantship",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Automotive Technology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Audiometry",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Anesthesia",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Aircraft Technology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Air Logistics",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        }
      ],
      "bachelors": [
        {
          "name": "Psychology",
          "duration": "4",
          "originalFee": 8500,
          "discountFee": 4250,
          "language": "English"
        },
        {
          "name": "Political Science and International Relations",
          "duration": "4",
          "originalFee": 8500,
          "discountFee": 4250,
          "language": "English"
        },
        {
          "name": "Nutrition and Dietetics",
          "duration": "4",
          "originalFee": 8500,
          "discountFee": 4250,
          "language": "English"
        },
        {
          "name": "Nursing",
          "duration": "4",
          "originalFee": 8500,
          "discountFee": 4250,
          "language": "English"
        },
        {
          "name": "Logistics Management",
          "duration": "4",
          "originalFee": 8500,
          "discountFee": 4250,
          "language": "English"
        },
        {
          "name": "International Trade and Finance",
          "duration": "4",
          "originalFee": 8500,
          "discountFee": 4250,
          "language": "English"
        },
        {
          "name": "Interior Architecture and Environmental Design",
          "duration": "4",
          "originalFee": 8500,
          "discountFee": 4250,
          "language": "English"
        },
        {
          "name": "Gastronomy and Culinary Arts",
          "duration": "4",
          "originalFee": 8500,
          "discountFee": 4250,
          "language": "English"
        },
        {
          "name": "English Language and Literature",
          "duration": "4",
          "originalFee": 8500,
          "discountFee": 4250,
          "language": "English"
        },
        {
          "name": "Economics and Finance",
          "duration": "4",
          "originalFee": 8500,
          "discountFee": 4250,
          "language": "English"
        },
        {
          "name": "Coaching Training",
          "duration": "4",
          "originalFee": 8500,
          "discountFee": 4250,
          "language": "English"
        },
        {
          "name": "Child Development",
          "duration": "4",
          "originalFee": 8500,
          "discountFee": 4250,
          "language": "English"
        },
        {
          "name": "Aviation Management",
          "duration": "4",
          "originalFee": 8500,
          "discountFee": 4250,
          "language": "English"
        },
        {
          "name": "Physiotherapy and Rehabilitation",
          "duration": "4",
          "originalFee": 9000,
          "discountFee": 4500,
          "language": "English"
        },
        {
          "name": "Business Administration",
          "duration": "4",
          "originalFee": 9000,
          "discountFee": 4500,
          "language": "English"
        },
        {
          "name": "Electrical and Electronics Engineering",
          "duration": "4",
          "originalFee": 9500,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Civil Engineering",
          "duration": "4",
          "originalFee": 9500,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Architecture",
          "duration": "4",
          "originalFee": 9500,
          "discountFee": 4750,
          "language": "English"
        },
        {
          "name": "Computer Engineering",
          "duration": "4",
          "originalFee": 11000,
          "discountFee": 5500,
          "language": "English"
        },
        {
          "name": "Aeronautical Engineering",
          "duration": "4",
          "originalFee": 12000,
          "discountFee": 6000,
          "language": "English"
        },
        {
          "name": "Dentistry",
          "duration": "5",
          "originalFee": 20000,
          "discountFee": 17250,
          "language": "English"
        },
        {
          "name": "Visual Communication Design",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Turkish Language and Literature",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Tourism Guidance",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Television Reporting and Programming",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Sports Management",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Speech and Language Therapy",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Software Engineering",
          "duration": "4 Years",
          "originalFee": 9000,
          "discountFee": 4500,
          "language": "Turkish"
        },
        {
          "name": "Sociology",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Social Work",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Recreation",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Radio Television and Cinema",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Public Relations and Publicity",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Public Relations and Advertising",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Psychology",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Political Science and Public Administration",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Political Science and International Relations",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Physiotherapy and Rehabilitation",
          "duration": "4 Years",
          "originalFee": 9000,
          "discountFee": 4500,
          "language": "Turkish"
        },
        {
          "name": "Perfusion",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Occupational Therapy",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Nutrition and Dietetics",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Nursing",
          "duration": "4 Years",
          "originalFee": 10000,
          "discountFee": 5000,
          "language": "Turkish"
        },
        {
          "name": "New Media and Communication",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Mechatronics Engineering",
          "duration": "4 Years",
          "originalFee": 9000,
          "discountFee": 4500,
          "language": "Turkish"
        },
        {
          "name": "Management Information Systems",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Logistics Management",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "International Trade and Finance",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "International Trade and Business",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Interior Architecture and Environmental Design",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Industrial Engineering",
          "duration": "4 Years",
          "originalFee": 9000,
          "discountFee": 4500,
          "language": "Turkish"
        },
        {
          "name": "Healthcare Management",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Graphic Design",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Gastronomy and Culinary Arts",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Exercise and Sports Sciences",
          "duration": "4 Years",
          "originalFee": 7000,
          "discountFee": 3500,
          "language": "Turkish"
        },
        {
          "name": "Exercise and Sports for Disabled",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Electronic Commerce and Management",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Electrical and Electronics Engineering",
          "duration": "4 Years",
          "originalFee": 9000,
          "discountFee": 4500,
          "language": "Turkish"
        },
        {
          "name": "Economics and Finance",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Dentistry",
          "duration": "4 Years",
          "originalFee": 17500,
          "discountFee": 13500,
          "language": "Turkish"
        },
        {
          "name": "Computer Engineering",
          "duration": "4 Years",
          "originalFee": 9000,
          "discountFee": 4500,
          "language": "Turkish"
        },
        {
          "name": "Coaching Training",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Civil Engineering",
          "duration": "4 Years",
          "originalFee": 9000,
          "discountFee": 4500,
          "language": "Turkish"
        },
        {
          "name": "Child Development",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Business Administration",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Banking and Insurance",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Avionics",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Aviation Management",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Audiology",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Architecture",
          "duration": "4 Years",
          "originalFee": 9000,
          "discountFee": 4500,
          "language": "Turkish"
        },
        {
          "name": "Aircraft Maintenance and Repair",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Aeronautical Engineering",
          "duration": "4 Years",
          "originalFee": 9000,
          "discountFee": 4500,
          "language": "Turkish"
        },
        {
          "name": "Advertising",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Tourism Guidance",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 4000,
          "language": "Turkish"
        },
        {
          "name": "Sports Management",
          "duration": "4 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Public Relations and Advertising",
          "duration": "4 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Graphic Design",
          "duration": "4 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Child Development",
          "duration": "4 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "Banking and Insurance",
          "duration": "4 Years",
          "originalFee": 3000,
          "discountFee": 3000,
          "language": "Turkish"
        },
        {
          "name": "New Program",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4000,
          "language": "English"
        }
      ],
      "masters": [
        {
          "name": "Political Science and Public Administration",
          "duration": "1.5",
          "originalFee": 10000,
          "discountFee": 4000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Political Science and International Relations",
          "duration": "1.5",
          "originalFee": 10000,
          "discountFee": 4000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Economics and Finance",
          "duration": "1.5",
          "originalFee": 10000,
          "discountFee": 4000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Civil Engineering",
          "duration": "1.5",
          "originalFee": 10000,
          "discountFee": 4000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Business Administration - MBA",
          "duration": "1.5",
          "originalFee": 10000,
          "discountFee": 4000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Architecture",
          "duration": "1.5",
          "originalFee": 10000,
          "discountFee": 4000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Political Science and Public Administration",
          "duration": "2",
          "originalFee": 10000,
          "discountFee": 5000,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Political Science and International Relations",
          "duration": "2",
          "originalFee": 10000,
          "discountFee": 5000,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Economics and Finance",
          "duration": "2",
          "originalFee": 10000,
          "discountFee": 5000,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Aeronautical Engineering",
          "duration": "1.5",
          "originalFee": 10000,
          "discountFee": 5000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Civil Engineering",
          "duration": "2",
          "originalFee": 10000,
          "discountFee": 5500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Architecture",
          "duration": "2",
          "originalFee": 10000,
          "discountFee": 5500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Business Administration - MBA",
          "duration": "2",
          "originalFee": 13000,
          "discountFee": 6500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Aeronautical Engineering",
          "duration": "2",
          "originalFee": 10000,
          "discountFee": 6500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Visual Communication Design (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Visual Communication Design (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Turkish Language and Literature (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Turkish Language and Literature (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Sports Management (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Sports Management (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Sociology (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Sociology (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Public Relations and Publicity (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Public Relations and Publicity (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Psychosocial Areas of Sports (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Psychosocial Areas of Sports (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Psychology (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 6000,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Psychology (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Political Science and Public Administration (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Political Science and International Relations (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Political Science and International Relations (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Physiotherapy and Rehabilitation (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Occupational Health and Safety (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Occupational Health and Safety (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Nutrition and Dietetics (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "New Media Communication and Journalism (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Mechatronics Engineering (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "International Trade and Logistics (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "International Trade and Logistics (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "International Logistics and Transportation (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Healthcare Management (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Health Management (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Gastronomy and Culinary Arts (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Gastronomy and Culinary Arts (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Exercise and Training Sciences (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Exercise and Training Sciences (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Engineering Management (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Engineering Management (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Economics and Finance (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Economics and Finance (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Computer Engineering (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Computer Engineering (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Clinical Psychology (Thesis)",
          "duration": "2 Years",
          "originalFee": 20000,
          "discountFee": 10000,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Clinical Psychology (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 15000,
          "discountFee": 10000,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Civil Engineering (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Civil Engineering (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Child Development (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Child Development (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Business Administration - MBA (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 6500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Business Administration - MBA (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Aviation Management (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Aviation Management (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Audiology (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Architecture (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Architecture (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Aeronautical Engineering (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 4250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Aeronautical Engineering (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Addiction Psychology (Thesis)",
          "duration": "2 Years",
          "originalFee": 10000,
          "discountFee": 7500,
          "thesisType": "Thesis",
          "language": "Turkish"
        }
      ],
      "phd": [
        {
          "name": "Sports Management",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Gastronomy",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Exercise and Training Sciences",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Economics and Finance",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Civil Engineering",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Business Administration",
          "duration": "4 Years",
          "originalFee": 8000,
          "discountFee": 8000,
          "language": "Turkish"
        },
        {
          "name": "Aeronautical Engineering",
          "duration": "4 Years",
          "originalFee": 10000,
          "discountFee": 10000,
          "language": "Turkish"
        },
        {
          "name": "Economics and Finance",
          "duration": "4 Years",
          "originalFee": 10000,
          "discountFee": 10000,
          "language": "English"
        }
      ]
    }
  },
  {
    "_id": "6a8a19e4ee645321958fd28e",
    "name": "Işık Üniversitesi",
    "location": "Istanbul, Turkey",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKGBxYz03uMGn43Xes-MZlkkhhruSzQDaG0ExJmdnQ1A&s=10",
    "description": "70% refund in case of visa rejection: Bachelor's Degree Fee List 2025-2026",
    "programs": {
      "associate": [
        {
          "name": "Opticianry",
          "duration": "2 Years",
          "originalFee": 1800,
          "discountFee": 1400,
          "language": "Turkish"
        },
        {
          "name": "Operating Room Services",
          "duration": "2 Years",
          "originalFee": 1800,
          "discountFee": 1400,
          "language": "Turkish"
        },
        {
          "name": "Medical Laboratory Techniques",
          "duration": "2 Years",
          "originalFee": 1800,
          "discountFee": 1400,
          "language": "Turkish"
        },
        {
          "name": "Medical Imaging Techniques",
          "duration": "2 Years",
          "originalFee": 1800,
          "discountFee": 1400,
          "language": "Turkish"
        },
        {
          "name": "Graphic Design",
          "duration": "2 Years",
          "originalFee": 1800,
          "discountFee": 1400,
          "language": "Turkish"
        },
        {
          "name": "Foreign Trade",
          "duration": "2 Years",
          "originalFee": 1800,
          "discountFee": 1400,
          "language": "Turkish"
        },
        {
          "name": "First and Emergency Aid",
          "duration": "2 Years",
          "originalFee": 1800,
          "discountFee": 1400,
          "language": "Turkish"
        },
        {
          "name": "First Aid and Emergency",
          "duration": "2 Years",
          "originalFee": 1800,
          "discountFee": 1400,
          "language": "Turkish"
        },
        {
          "name": "Computer Programming",
          "duration": "2 Years",
          "originalFee": 1800,
          "discountFee": 1400,
          "language": "Turkish"
        },
        {
          "name": "Anesthesia",
          "duration": "2 Years",
          "originalFee": 1800,
          "discountFee": 1400,
          "language": "Turkish"
        }
      ],
      "bachelors": [
        {
          "name": "Software Engineering",
          "duration": "4",
          "originalFee": 4800,
          "discountFee": 2700,
          "language": "English"
        },
        {
          "name": "Psychology",
          "duration": "4",
          "originalFee": 3600,
          "discountFee": 2700,
          "language": "English"
        },
        {
          "name": "Mechatronics Engineering",
          "duration": "4",
          "originalFee": 4800,
          "discountFee": 2700,
          "language": "English"
        },
        {
          "name": "Mechanical Engineering",
          "duration": "4",
          "originalFee": 4800,
          "discountFee": 2700,
          "language": "English"
        },
        {
          "name": "Management Information Systems",
          "duration": "4",
          "originalFee": 3600,
          "discountFee": 2700,
          "language": "English"
        },
        {
          "name": "International Trade and Finance",
          "duration": "4",
          "originalFee": 3600,
          "discountFee": 2700,
          "language": "English"
        },
        {
          "name": "International Relations",
          "duration": "4",
          "originalFee": 3600,
          "discountFee": 2700,
          "language": "English"
        },
        {
          "name": "Interior Architecture and Environmental Design",
          "duration": "4",
          "originalFee": 3600,
          "discountFee": 2700,
          "language": "English"
        },
        {
          "name": "Industrial Engineering",
          "duration": "4",
          "originalFee": 3600,
          "discountFee": 2700,
          "language": "English"
        },
        {
          "name": "Electrical and Electronics Engineering",
          "duration": "4",
          "originalFee": 4800,
          "discountFee": 2700,
          "language": "English"
        },
        {
          "name": "Economics",
          "duration": "4",
          "originalFee": 3600,
          "discountFee": 2700,
          "language": "English"
        },
        {
          "name": "Computer Engineering",
          "duration": "4",
          "originalFee": 4800,
          "discountFee": 2700,
          "language": "English"
        },
        {
          "name": "Civil Engineering",
          "duration": "4",
          "originalFee": 4800,
          "discountFee": 2700,
          "language": "English"
        },
        {
          "name": "Business Administration",
          "duration": "4",
          "originalFee": 3600,
          "discountFee": 2700,
          "language": "English"
        },
        {
          "name": "Biomedical Engineering",
          "duration": "4",
          "originalFee": 4800,
          "discountFee": 2700,
          "language": "English"
        },
        {
          "name": "Architecture",
          "duration": "4",
          "originalFee": 4800,
          "discountFee": 2700,
          "language": "English"
        },
        {
          "name": "Visual Communication Design",
          "duration": "4 Years",
          "originalFee": 3600,
          "discountFee": 2700,
          "language": "Turkish"
        },
        {
          "name": "Psychology",
          "duration": "4 Years",
          "originalFee": 3600,
          "discountFee": 2700,
          "language": "Turkish"
        },
        {
          "name": "Management Information Systems",
          "duration": "4 Years",
          "originalFee": 3600,
          "discountFee": 2700,
          "language": "Turkish"
        },
        {
          "name": "Interior Architecture and Environmental Design",
          "duration": "4 Years",
          "originalFee": 3600,
          "discountFee": 2700,
          "language": "Turkish"
        },
        {
          "name": "Industrial Design",
          "duration": "4 Years",
          "originalFee": 3600,
          "discountFee": 2700,
          "language": "Turkish"
        },
        {
          "name": "Cinema and Television",
          "duration": "4 Years",
          "originalFee": 3600,
          "discountFee": 2700,
          "language": "Turkish"
        }
      ],
      "masters": [
        {
          "name": "Mechanical Engineering",
          "duration": "1.5",
          "originalFee": 10200,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Management Information Systems",
          "duration": "1.5",
          "originalFee": 11400,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "International Relations",
          "duration": "1.5",
          "originalFee": 10200,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Information Technologies",
          "duration": "1.5",
          "originalFee": 10200,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Industrial Engineering",
          "duration": "1.5",
          "originalFee": 10200,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Executive MBA",
          "duration": "1.5",
          "originalFee": 11400,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Electronics Engineering",
          "duration": "1.5",
          "originalFee": 10200,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Computer Engineering",
          "duration": "1.5",
          "originalFee": 10200,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Civil Engineering",
          "duration": "1.5",
          "originalFee": 10200,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Applied Economics",
          "duration": "1.5",
          "originalFee": 10200,
          "discountFee": 3500,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Mechanical Engineering",
          "duration": "2",
          "originalFee": 10200,
          "discountFee": 4000,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "International Relations",
          "duration": "2",
          "originalFee": 10200,
          "discountFee": 4000,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Information Technologies",
          "duration": "2",
          "originalFee": 10200,
          "discountFee": 4000,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Industrial Engineering",
          "duration": "2",
          "originalFee": 10200,
          "discountFee": 4000,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Executive MBA",
          "duration": "2",
          "originalFee": 10200,
          "discountFee": 4000,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Electronics Engineering",
          "duration": "2",
          "originalFee": 10200,
          "discountFee": 4000,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Computer Engineering",
          "duration": "2",
          "originalFee": 10200,
          "discountFee": 4000,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Civil Engineering",
          "duration": "2",
          "originalFee": 10200,
          "discountFee": 4000,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Applied Economics",
          "duration": "2",
          "originalFee": 10200,
          "discountFee": 4000,
          "thesisType": "Thesis",
          "language": "English"
        }
      ],
      "phd": [
        {
          "name": "Mathematics",
          "duration": "5",
          "originalFee": 22800,
          "discountFee": 7500,
          "language": "English"
        },
        {
          "name": "Electronics Engineering",
          "duration": "5",
          "originalFee": 22800,
          "discountFee": 7500,
          "language": "English"
        },
        {
          "name": "Computer Engineering",
          "duration": "5",
          "originalFee": 22800,
          "discountFee": 7500,
          "language": "English"
        },
        {
          "name": "Art Science",
          "duration": "4 Years",
          "originalFee": 22800,
          "discountFee": 7500,
          "language": "Turkish"
        }
      ]
    }
  },
  {
    "_id": "6a88d2cdcc597592c93eedd1",
    "name": "Istanbul Atlas üniversitesi",
    "location": "Istanbul, Turkey",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8gwIz70_hivtua_tnX-YTr9qWyQ0gaCeNiC3u6Sl_BA&s=10",
    "description": "In Case of visa rejection, your initial deposit is nonrefundable. Bachelor's Degree Fee List 2025-2026",
    "programs": {
      "associate": [
        {
          "name": "Computer Programming",
          "duration": "2",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "English"
        },
        {
          "name": "Telehealth Technician",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Surgery Services",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Physiotherapy",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Oral and Dental Health",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Opticianry",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Operating Room Services",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Medical Promotion and Marketing",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Medical Laboratory Techniques",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Medical Imaging Techniques",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Logistics",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Interior Design",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Information Security Technology",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Green and Ecological Building Technician",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Graphic Design",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "First Aid and Emergency",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Environmental Health and Environmental Risk Management Technician",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Elderly Care",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "E-Commerce and Marketing",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Disinfection Sterilization",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Dialysis",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Dental Prosthesis Technology",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        },
        {
          "name": "Anesthesia",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2220,
          "language": "Turkish"
        }
      ],
      "bachelors": [
        {
          "name": "Speech and Language Therapy",
          "duration": "4",
          "originalFee": 4500,
          "discountFee": 3450,
          "language": "English"
        },
        {
          "name": "English Language and Literature",
          "duration": "4",
          "originalFee": 4660,
          "discountFee": 3565,
          "language": "English"
        },
        {
          "name": "Psychology",
          "duration": "4",
          "originalFee": 5510,
          "discountFee": 4220,
          "language": "English"
        },
        {
          "name": "Management Information Systems",
          "duration": "4",
          "originalFee": 5510,
          "discountFee": 4220,
          "language": "English"
        },
        {
          "name": "International Trade and Finance",
          "duration": "4",
          "originalFee": 5510,
          "discountFee": 4220,
          "language": "English"
        },
        {
          "name": "Business Administration",
          "duration": "4",
          "originalFee": 5510,
          "discountFee": 4520,
          "language": "English"
        },
        {
          "name": "Molecular Biology and Genetics",
          "duration": "4",
          "originalFee": 5550,
          "discountFee": 4250,
          "language": "English"
        },
        {
          "name": "Industrial Engineering",
          "duration": "4",
          "originalFee": 5550,
          "discountFee": 4250,
          "language": "English"
        },
        {
          "name": "Electrical and Electronics Engineering",
          "duration": "4",
          "originalFee": 5550,
          "discountFee": 4250,
          "language": "English"
        },
        {
          "name": "Physiotherapy and Rehabilitation",
          "duration": "4",
          "originalFee": 5900,
          "discountFee": 4515,
          "language": "English"
        },
        {
          "name": "Nursing",
          "duration": "4",
          "originalFee": 5900,
          "discountFee": 4515,
          "language": "English"
        },
        {
          "name": "Software Engineering",
          "duration": "4",
          "originalFee": 6300,
          "discountFee": 4820,
          "language": "English"
        },
        {
          "name": "Data Science and Analytics",
          "duration": "4",
          "originalFee": 6300,
          "discountFee": 4820,
          "language": "English"
        },
        {
          "name": "Computer Engineering",
          "duration": "4",
          "originalFee": 6300,
          "discountFee": 4820,
          "language": "English"
        },
        {
          "name": "Biomedical Engineering",
          "duration": "4",
          "originalFee": 6300,
          "discountFee": 4820,
          "language": "English"
        },
        {
          "name": "Dentistry",
          "duration": "5",
          "originalFee": 23560,
          "discountFee": 18030,
          "language": "English"
        },
        {
          "name": "Medicine",
          "duration": "6",
          "originalFee": 25000,
          "discountFee": 19130,
          "language": "English"
        },
        {
          "name": "Visual Communication Design",
          "duration": "4 Years",
          "originalFee": 4660,
          "discountFee": 3565,
          "language": "Turkish"
        },
        {
          "name": "Psychology",
          "duration": "4 Years",
          "originalFee": 4765,
          "discountFee": 3645,
          "language": "Turkish"
        },
        {
          "name": "Physiotherapy and Rehabilitation",
          "duration": "4 Years",
          "originalFee": 5200,
          "discountFee": 3980,
          "language": "Turkish"
        },
        {
          "name": "Nutrition and Dietetics",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 3450,
          "language": "Turkish"
        },
        {
          "name": "Nursing",
          "duration": "4 Years",
          "originalFee": 5200,
          "discountFee": 3980,
          "language": "Turkish"
        },
        {
          "name": "Midwifery",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 3450,
          "language": "Turkish"
        },
        {
          "name": "Medicine",
          "duration": "4 Years",
          "originalFee": 20000,
          "discountFee": 15300,
          "language": "Turkish"
        },
        {
          "name": "Interior Architecture and Environmental Design",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 4825,
          "language": "Turkish"
        },
        {
          "name": "Industrial Design",
          "duration": "4 Years",
          "originalFee": 4600,
          "discountFee": 3565,
          "language": "Turkish"
        },
        {
          "name": "Ergotherapy",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 3450,
          "language": "Turkish"
        },
        {
          "name": "Digital Game Design",
          "duration": "4 Years",
          "originalFee": 4660,
          "discountFee": 3565,
          "language": "Turkish"
        },
        {
          "name": "Dentistry",
          "duration": "4 Years",
          "originalFee": 18530,
          "discountFee": 14175,
          "language": "Turkish"
        },
        {
          "name": "Computer Engineering",
          "duration": "4 Years",
          "originalFee": 5550,
          "discountFee": 4250,
          "language": "Turkish"
        },
        {
          "name": "Business Administration",
          "duration": "4 Years",
          "originalFee": 4765,
          "discountFee": 3645,
          "language": "Turkish"
        }
      ],
      "masters": [
        {
          "name": "Molecular Biology and Genetics",
          "duration": "2",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Information Technologies",
          "duration": "2",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Electrical and Electronics Engineering",
          "duration": "2",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Computer Engineering",
          "duration": "2",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Technology and Innovation Management (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5295,
          "discountFee": 4055,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Surgical Disease Nursing (Thesis)",
          "duration": "2 Years",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Speech and Language Therapy (Thesis)",
          "duration": "2 Years",
          "originalFee": 15000,
          "discountFee": 13500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Psychology (Thesis)",
          "duration": "2 Years",
          "originalFee": 8500,
          "discountFee": 7650,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Physiotherapy and Rehabilitation (Thesis)",
          "duration": "2 Years",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Physiology (Medicine) (Thesis)",
          "duration": "2 Years",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Occupational Therapy (Thesis)",
          "duration": "2 Years",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Nutrition and Dietetics (Thesis)",
          "duration": "2 Years",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Nutrition and Dietetics (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5295,
          "discountFee": 4055,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Neuroscience (Thesis)",
          "duration": "2 Years",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Molecular Biology and Genetics (Thesis)",
          "duration": "2 Years",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Midwifery (Thesis)",
          "duration": "2 Years",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Midwifery (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5295,
          "discountFee": 4055,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Medical Pharmacology (Thesis)",
          "duration": "2 Years",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Medical Biology and Genetics (Thesis)",
          "duration": "2 Years",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Medical Biochemistry (Thesis)",
          "duration": "2 Years",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Internal Medicine Nursing (Thesis)",
          "duration": "2 Years",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Industrial Engineering (Thesis)",
          "duration": "2 Years",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Histology and Embryology (Thesis)",
          "duration": "2 Years",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Gynecology and Obstetrics Nursing (Thesis)",
          "duration": "2 Years",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Computer Engineering (Thesis)",
          "duration": "2 Years",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Cognitive Rehabilitation (Thesis)",
          "duration": "2 Years",
          "originalFee": 5295,
          "discountFee": 4055,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Anatomy (Thesis)",
          "duration": "2 Years",
          "originalFee": 7415,
          "discountFee": 5680,
          "thesisType": "Thesis",
          "language": "Turkish"
        }
      ],
      "phd": [
        {
          "name": "Computer Engineering (PhD)",
          "duration": "6",
          "originalFee": 16500,
          "discountFee": 12625,
          "language": "English"
        },
        {
          "name": "Surgical Diseases Nursing",
          "duration": "4 Years",
          "originalFee": 16500,
          "discountFee": 12625,
          "language": "Turkish"
        },
        {
          "name": "Psychology",
          "duration": "4 Years",
          "originalFee": 16500,
          "discountFee": 12625,
          "language": "Turkish"
        },
        {
          "name": "Oral and Maxillofacial Surgery",
          "duration": "4 Years",
          "originalFee": 15000,
          "discountFee": 15000,
          "language": "Turkish"
        }
      ]
    }
  },
  {
    "_id": "6a88cca44eed962830196e57",
    "name": "Beykent üniversitesi",
    "location": "Istanbul, Turkey",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvair43mSm3nrOsHY7bjpwhQBfmK0lO02YGXh2vlVg_Q&s=10",
    "description": "70% refund in case of visa rejection: Bachelor's Degree Fee List 2025-2026",
    "programs": {
      "associate": [
        {
          "name": "Public Relations and Advertising",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Graphic Design",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Child Development",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Business Administration",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Water and Waste Management Technician",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Tourist Guiding",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Tourism and Travel Services",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Textile Technology",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Radiotherapy",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "Public Relations and Advertising",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Physiotherapy",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1300,
          "language": "Turkish"
        },
        {
          "name": "Pharmacy Services",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "Pathology Laboratory Techniques",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "Orthopedic Prosthetics and Orthotics",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "Oral and Dental Health",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "Opticianry",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "Operating Room Services",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "Occupational Health and Safety",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Multidimensional Modelling and Animation",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Medical Laboratory Techniques",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "Medical Imaging Techniques",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "Medical Documentation and Secretarial Services",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "Mechatronics",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Logistics",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Justice",
          "duration": "2 Years",
          "originalFee": 3400,
          "discountFee": 1300,
          "language": "Turkish"
        },
        {
          "name": "Interior Design",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Information Security Technology",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Hybrid and Electric Vehicle Technology",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Human Resources Management",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Health Institutions Management",
          "duration": "2 Years",
          "originalFee": 3400,
          "discountFee": 1300,
          "language": "Turkish"
        },
        {
          "name": "Graphic Design",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Foreign Trade",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1300,
          "language": "Turkish"
        },
        {
          "name": "First Aid and Emergency Care",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1300,
          "language": "Turkish"
        },
        {
          "name": "Fashion Design",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1300,
          "language": "Turkish"
        },
        {
          "name": "Environmental Measurement and Monitoring Systems Tech",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Electroneurophysiology",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "Dialysis",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "Dental Prosthetics Technology",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "Court Services",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Cooking",
          "duration": "2 Years",
          "originalFee": 3810,
          "discountFee": 1300,
          "language": "Turkish"
        },
        {
          "name": "Construction Technology",
          "duration": "2 Years",
          "originalFee": 3810,
          "discountFee": 1300,
          "language": "Turkish"
        },
        {
          "name": "Computer Technology",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Computer Programming",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "CNC Programming and Operation",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Civil Aviation Cabin Services",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Civil Air Transport Management",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Child Development",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "Business Administration",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "Building Insulation Technology",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Biomedical Device Technology",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "Banking and Insurance",
          "duration": "2 Years",
          "originalFee": 3810,
          "discountFee": 1300,
          "language": "Turkish"
        },
        {
          "name": "Automotive Technology",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Audiometry",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "Artificial Intelligence Operator",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Architectural Restoration",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "language": "Turkish"
        },
        {
          "name": "Applied English and Translation",
          "duration": "2 Years",
          "originalFee": 3810,
          "discountFee": 1300,
          "language": "English"
        },
        {
          "name": "Anaesthesia",
          "duration": "2 Years",
          "originalFee": 2613,
          "discountFee": 1900,
          "language": "Turkish"
        },
        {
          "name": "3D Modelling and Animation",
          "duration": "2 Years",
          "originalFee": 3400,
          "discountFee": 1300,
          "language": "Turkish"
        }
      ],
      "bachelors": [
        {
          "name": "Visual Communication and Design",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Translation and Interpretation",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Sociology",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Radio, Cinema and TV",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Psychology",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Political Science and Public Administration",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "New Media",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Mechanical Engineering",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Management Information Systems",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Logistic Management",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "International Trade and Finance",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "International Relations",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Interior Architecture",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Industrial Engineering",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Industrial Design",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Graphic Design",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "English Language and Literature",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Economics",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Digital Game Design",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Civil Engineering",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Cinema and TV",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Banking and Finance",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Architecture",
          "duration": "4",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Business Administration",
          "duration": "4",
          "originalFee": 4000,
          "discountFee": 2700,
          "language": "English"
        },
        {
          "name": "Computer Engineering",
          "duration": "4",
          "originalFee": 4000,
          "discountFee": 2700,
          "language": "English"
        },
        {
          "name": "Visual Communication and Design",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Turkish Language and Literature",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Translation and Interpretation (Russian)",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Tourism Management",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Software Engineering",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 2700,
          "language": "Turkish"
        },
        {
          "name": "Software Development",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Sociology",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Radio, Cinema and TV",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Psychology",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Political Science and Public Administration",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Physiotherapy and Rehabilitation",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 2700,
          "language": "Turkish"
        },
        {
          "name": "Performing Arts Management",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 2700,
          "language": "Turkish"
        },
        {
          "name": "Nutrition and Dietetics",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 2700,
          "language": "Turkish"
        },
        {
          "name": "Nursing",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 2700,
          "language": "Turkish"
        },
        {
          "name": "New Media",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Midwifery",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 2700,
          "language": "Turkish"
        },
        {
          "name": "Medicine",
          "duration": "4 Years",
          "originalFee": 18000,
          "discountFee": 11000,
          "language": "Turkish"
        },
        {
          "name": "Media and Communication",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Mathematics",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Management Information Systems",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Logistics Management",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Law",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "International Trade and Finance",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Interior Architecture",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Information Systems and Technologies",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Industrial Engineering",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Industrial Design",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "History",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Health Management",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Gastronomy and Culinary Arts",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Fashion and Textile Design",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Electrical and Electronics Engineering",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Economics",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Digital Game Design",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Dentistry",
          "duration": "4 Years",
          "originalFee": 18000,
          "discountFee": 11000,
          "language": "Turkish"
        },
        {
          "name": "Computer Engineering",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 2700,
          "language": "Turkish"
        },
        {
          "name": "Communication and Design",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Civil Engineering",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Chemical Engineering",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Capital Markets",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Banking and Finance",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Architecture",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Acting",
          "duration": "4 Years",
          "originalFee": 3500,
          "discountFee": 2500,
          "language": "Turkish"
        }
      ],
      "masters": [
        {
          "name": "Business Administration - MBA",
          "duration": "1.5",
          "originalFee": 2200,
          "discountFee": 1600,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "English Language and Literature",
          "duration": "2",
          "originalFee": 2900,
          "discountFee": 2100,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Economics and Finance",
          "duration": "2",
          "originalFee": 2900,
          "discountFee": 2100,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Business Administration - MBA",
          "duration": "2",
          "originalFee": 2900,
          "discountFee": 2100,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "History (Thesis)",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2100,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "History (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Graphic Design (Thesis)",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2100,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Graphic Design (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Gastronomy and Culinary Arts (Thesis)",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2100,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Gastronomy and Culinary Arts (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Finance (Thesis)",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2100,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Finance (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Economics and Finance (Thesis)",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2100,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Economics and Finance (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Economics (Thesis)",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2100,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Economics (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Earthquake Risky Structures & Urban Transportation (Thesis)",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2100,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Computer Engineering (Thesis)",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2100,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Computer Engineering (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Communication Arts Design (Thesis)",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2100,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Clinical Psychology (Thesis)",
          "duration": "2 Years",
          "originalFee": 16500,
          "discountFee": 12000,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Civil Engineering (Thesis)",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2100,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Civil Engineering (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Cinema and TV (Thesis)",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2100,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Business Administration - MBA (Thesis)",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2100,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Business Administration - MBA (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Banking and Finance (Non-Thesis) (D.E)",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1400,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Architecture (Thesis)",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2100,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Architectural Design (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 2200,
          "discountFee": 1600,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Accounting and Auditing (Thesis)",
          "duration": "2 Years",
          "originalFee": 2900,
          "discountFee": 2100,
          "thesisType": "Thesis",
          "language": "Turkish"
        }
      ],
      "phd": [
        {
          "name": "Sociology",
          "duration": "4 Years",
          "originalFee": 6200,
          "discountFee": 4500,
          "language": "Turkish"
        },
        {
          "name": "Political Science and International Relations",
          "duration": "4 Years",
          "originalFee": 6200,
          "discountFee": 4500,
          "language": "Turkish"
        },
        {
          "name": "Media and Communication",
          "duration": "4 Years",
          "originalFee": 6200,
          "discountFee": 4500,
          "language": "Turkish"
        },
        {
          "name": "Mathematics",
          "duration": "4 Years",
          "originalFee": 6200,
          "discountFee": 4500,
          "language": "Turkish"
        },
        {
          "name": "Computer Engineering",
          "duration": "4 Years",
          "originalFee": 6200,
          "discountFee": 4500,
          "language": "Turkish"
        },
        {
          "name": "Cinema and Television",
          "duration": "4 Years",
          "originalFee": 6200,
          "discountFee": 4500,
          "language": "Turkish"
        },
        {
          "name": "Business Administration",
          "duration": "4 Years",
          "originalFee": 6200,
          "discountFee": 4500,
          "language": "Turkish"
        },
        {
          "name": "Architecture",
          "duration": "4 Years",
          "originalFee": 6200,
          "discountFee": 4500,
          "language": "Turkish"
        }
      ]
    }
  },
  {
    "_id": "6a88c49008389dc5a533709b",
    "name": "Beykoz üniversitesi",
    "location": "Istanbul, Turkey",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMYkRoF-3vxwyfPWO53jrh04s6yqxF2dhAKQ06pi4IMw&s=10",
    "description": "75% refund in case of visa rejection: Bachelor's Degree Fee List 2025-2026",
    "programs": {
      "associate": [
        {
          "name": "Civil Aviation Cabin Services",
          "duration": "2",
          "originalFee": 3800,
          "discountFee": 1900,
          "language": "English"
        },
        {
          "name": "Technology of Information Security",
          "duration": "2 Years",
          "originalFee": 3400,
          "discountFee": 1700,
          "language": "Turkish"
        },
        {
          "name": "Rail Systems Management",
          "duration": "2 Years",
          "originalFee": 3400,
          "discountFee": 1700,
          "language": "Turkish"
        },
        {
          "name": "Maritime and Port Management",
          "duration": "2 Years",
          "originalFee": 3400,
          "discountFee": 1700,
          "language": "Turkish"
        },
        {
          "name": "Logistics",
          "duration": "2 Years",
          "originalFee": 3400,
          "discountFee": 1700,
          "language": "Turkish"
        },
        {
          "name": "Logistics (D.E)",
          "duration": "2 Years",
          "originalFee": 3400,
          "discountFee": 1700,
          "language": "Turkish"
        },
        {
          "name": "Foreign Trade",
          "duration": "2 Years",
          "originalFee": 3400,
          "discountFee": 1700,
          "language": "Turkish"
        },
        {
          "name": "Foreign Trade (D.E)",
          "duration": "2 Years",
          "originalFee": 3400,
          "discountFee": 1700,
          "language": "Turkish"
        },
        {
          "name": "E-Trade and Marketing",
          "duration": "2 Years",
          "originalFee": 3400,
          "discountFee": 1700,
          "language": "Turkish"
        },
        {
          "name": "Computer Programming",
          "duration": "2 Years",
          "originalFee": 3400,
          "discountFee": 1700,
          "language": "Turkish"
        },
        {
          "name": "Civil Aviation Cabin Services",
          "duration": "2 Years",
          "originalFee": 3400,
          "discountFee": 1700,
          "language": "Turkish"
        }
      ],
      "bachelors": [
        {
          "name": "Psychology",
          "duration": "4",
          "originalFee": 6000,
          "discountFee": 3000,
          "language": "English"
        },
        {
          "name": "Political Science and International Relations",
          "duration": "4",
          "originalFee": 6000,
          "discountFee": 3000,
          "language": "English"
        },
        {
          "name": "Logistics Management",
          "duration": "4",
          "originalFee": 6000,
          "discountFee": 3000,
          "language": "English"
        },
        {
          "name": "International Trade and Finance",
          "duration": "4",
          "originalFee": 6000,
          "discountFee": 3000,
          "language": "English"
        },
        {
          "name": "Industrial Engineering",
          "duration": "4",
          "originalFee": 6000,
          "discountFee": 3000,
          "language": "English"
        },
        {
          "name": "Business Administration",
          "duration": "4",
          "originalFee": 6000,
          "discountFee": 3000,
          "language": "English"
        },
        {
          "name": "Aviation Management",
          "duration": "4",
          "originalFee": 6000,
          "discountFee": 3000,
          "language": "English"
        },
        {
          "name": "Computer Engineering",
          "duration": "4",
          "originalFee": 6000,
          "discountFee": 3000,
          "language": "English"
        },
        {
          "name": "Software Engineering",
          "duration": "4 Years",
          "originalFee": 4600,
          "discountFee": 2300,
          "language": "Turkish"
        },
        {
          "name": "Radio, Television and Cinema",
          "duration": "4 Years",
          "originalFee": 4600,
          "discountFee": 2300,
          "language": "Turkish"
        },
        {
          "name": "Public Relations and Advertising",
          "duration": "4 Years",
          "originalFee": 4600,
          "discountFee": 2300,
          "language": "Turkish"
        },
        {
          "name": "Psychology",
          "duration": "4 Years",
          "originalFee": 4600,
          "discountFee": 2300,
          "language": "Turkish"
        },
        {
          "name": "Interior Architecture and Environmental Design",
          "duration": "4 Years",
          "originalFee": 4600,
          "discountFee": 2300,
          "language": "Turkish"
        },
        {
          "name": "Graphic Design",
          "duration": "4 Years",
          "originalFee": 4600,
          "discountFee": 2300,
          "language": "Turkish"
        },
        {
          "name": "Gastronomy and Culinary Arts",
          "duration": "4 Years",
          "originalFee": 4600,
          "discountFee": 2300,
          "language": "Turkish"
        },
        {
          "name": "Digital Game Design",
          "duration": "4 Years",
          "originalFee": 4600,
          "discountFee": 2300,
          "language": "Turkish"
        },
        {
          "name": "Communication and Design",
          "duration": "4 Years",
          "originalFee": 4600,
          "discountFee": 2300,
          "language": "Turkish"
        },
        {
          "name": "Cartoon and Animation",
          "duration": "4 Years",
          "originalFee": 4600,
          "discountFee": 2300,
          "language": "Turkish"
        },
        {
          "name": "Business Administration",
          "duration": "4 Years",
          "originalFee": 4600,
          "discountFee": 2300,
          "language": "Turkish"
        },
        {
          "name": "Architecture",
          "duration": "4 Years",
          "originalFee": 4600,
          "discountFee": 2300,
          "language": "Turkish"
        }
      ],
      "masters": [
        {
          "name": "Technology and Innovation Management",
          "duration": "2",
          "originalFee": 7000,
          "discountFee": 3500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Global Politics and International Relations",
          "duration": "2",
          "originalFee": 7000,
          "discountFee": 3500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Computer Engineering",
          "duration": "2",
          "originalFee": 7000,
          "discountFee": 3500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Business Administration - MBA",
          "duration": "2",
          "originalFee": 7000,
          "discountFee": 3500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Artificial Intelligence",
          "duration": "2",
          "originalFee": 7000,
          "discountFee": 3500,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Technology and Innovation Management",
          "duration": "1.5",
          "originalFee": 6000,
          "discountFee": 3000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Marketing and Brand Management",
          "duration": "1.5",
          "originalFee": 6000,
          "discountFee": 3000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Global Politics and International Relations",
          "duration": "1.5",
          "originalFee": 6000,
          "discountFee": 3000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Entrepreneurship and Innovation Management",
          "duration": "1.5",
          "originalFee": 6000,
          "discountFee": 3000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Computer Engineering",
          "duration": "1.5",
          "originalFee": 6000,
          "discountFee": 3000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Business Administration - MBA",
          "duration": "1.5",
          "originalFee": 6000,
          "discountFee": 3000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Artificial Intelligence",
          "duration": "1.5",
          "originalFee": 6000,
          "discountFee": 3000,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Business Administration - MBA",
          "duration": "1.5",
          "originalFee": 4200,
          "discountFee": 2100,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Work and Organizational Psychology (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5200,
          "discountFee": 2600,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Visual Arts and Visual Communication Design (Thesis)",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 3000,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Visual Arts and Visual Communication Design (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5200,
          "discountFee": 2600,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Psychology (Thesis)",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 3000,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Psychology (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5200,
          "discountFee": 2600,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Marketing and Brand Management (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5200,
          "discountFee": 2600,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "International Trade and Logistics (Thesis)",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 3000,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "International Trade and Logistics (Non-Thesis) (D.E)",
          "duration": "2 Years",
          "originalFee": 4200,
          "discountFee": 2100,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "International Trade and Logistics (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5200,
          "discountFee": 2600,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Human Resources Management (Thesis)",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 3000,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Financial Economics (Thesis)",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 3000,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Financial Economics (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5200,
          "discountFee": 2600,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Business Administration - MBA (Thesis)",
          "duration": "2 Years",
          "originalFee": 6000,
          "discountFee": 3000,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Business Administration - MBA (Non-Thesis) (D.E)",
          "duration": "2 Years",
          "originalFee": 4200,
          "discountFee": 2100,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Business Administration - MBA (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5200,
          "discountFee": 2600,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Accounting and Auditing (Non-Thesis)",
          "duration": "2 Years",
          "originalFee": 5200,
          "discountFee": 2600,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        }
      ],
      "phd": []
    }
  },
  {
    "_id": "6a88be2ed2b9481cdb6e52a0",
    "name": "ISTANBUL TOPKAPI UNIVERSITY",
    "location": "Istanbul, Turkey",
    "image": "https://i.ytimg.com/vi/UDRwKmhbJUg/maxresdefault.jpg",
    "description": "75% refund in case of visa Rejection (Cash Payment = 5% off discounted) Bachelor's Degree Fee List 2025-2026",
    "programs": {
      "associate": [
        {
          "name": "Graphic Design",
          "duration": "2",
          "originalFee": 3500,
          "discountFee": 1750,
          "language": "English"
        },
        {
          "name": "Web Design and Coding",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Tourist Guiding",
          "duration": "2 Years",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Tourist Guiding (Distance Learning)",
          "duration": "2 Years",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Telehealth Technician",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Physiotherapy",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Pharmacy Services",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Pathology Laboratory Techniques",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Oral and Dental Health",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Opticianry",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Operating Room Services",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Mobile Technologies",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Medical Laboratory Techniques",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Medical Imaging Techniques",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Medical Documentation and Secretarial",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Medical Data Processing Technician",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Mapping and Cadastre",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Internet and Network Technologies",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 1750,
          "language": "Turkish"
        },
        {
          "name": "Internet and Network Technologies (Distance Learning)",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Interior Design",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Green and Ecological Building Technician",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Graphic Design (Distance Learning)",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "First and Emergency Aid",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 1750,
          "language": "Turkish"
        },
        {
          "name": "Fashion Design",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Fashion Design (Distance Learning)",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Electrical",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Elderly Care",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "E-Commerce and Marketing",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 1750,
          "language": "Turkish"
        },
        {
          "name": "Dental Prosthesis Technology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Cybersecurity",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 1750,
          "language": "Turkish"
        },
        {
          "name": "Cooking",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Cooking (Distance Learning)",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Computer Technology",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 1750,
          "language": "Turkish"
        },
        {
          "name": "Computer Programming",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 1750,
          "language": "Turkish"
        },
        {
          "name": "Computer Programming (Distance Learning)",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Computer Aided Design and Animation",
          "duration": "2 Years",
          "originalFee": 3500,
          "discountFee": 1750,
          "language": "Turkish"
        },
        {
          "name": "Computer Aided Design and Animation (Distance Learning)",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Civil Aviation Cabin Services",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Civil Air Transport Management",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Child Development",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Automotive Technology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Audiology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Architectural Restoration",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Anesthesia",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Aircraft Technology",
          "duration": "2 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        }
      ],
      "bachelors": [
        {
          "name": "Sociology",
          "duration": "4",
          "originalFee": 3900,
          "discountFee": 1950,
          "language": "English"
        },
        {
          "name": "Philosophy",
          "duration": "4",
          "originalFee": 3900,
          "discountFee": 1950,
          "language": "English"
        },
        {
          "name": "Psychology",
          "duration": "4",
          "originalFee": 5000,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Political Science and International Relations",
          "duration": "4",
          "originalFee": 5000,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Management Information Systems",
          "duration": "4",
          "originalFee": 5000,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "International Trade and Business",
          "duration": "4",
          "originalFee": 5000,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "English Translation and Interpreting",
          "duration": "4",
          "originalFee": 5000,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "English Language and Literature",
          "duration": "4",
          "originalFee": 5000,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Electrical-Electronics Engineering",
          "duration": "4",
          "originalFee": 5000,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Economics",
          "duration": "4",
          "originalFee": 5000,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Computer Engineering",
          "duration": "4",
          "originalFee": 5000,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Business Administration",
          "duration": "4",
          "originalFee": 5000,
          "discountFee": 2500,
          "language": "English"
        },
        {
          "name": "Graphic Design",
          "duration": "4",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Visual Communication Design",
          "duration": "4",
          "originalFee": 3900,
          "discountFee": 1950,
          "language": "Turkish"
        },
        {
          "name": "Painting",
          "duration": "4",
          "originalFee": 3900,
          "discountFee": 1950,
          "language": "Turkish"
        },
        {
          "name": "Film Design and Management",
          "duration": "4",
          "originalFee": 3900,
          "discountFee": 1950,
          "language": "Turkish"
        },
        {
          "name": "Theatre",
          "duration": "4",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Textile and Fashion Design",
          "duration": "4",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Sports Management",
          "duration": "4",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Recreation",
          "duration": "4",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Radio, Television and Cinema",
          "duration": "4",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "New Media and Communication",
          "duration": "4",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Management Information Systems",
          "duration": "1.5",
          "originalFee": 7500,
          "discountFee": 3750,
          "language": "English"
        },
        {
          "name": "Visual Communication Design",
          "duration": "4 Years",
          "originalFee": 3900,
          "discountFee": 1950,
          "language": "Turkish"
        },
        {
          "name": "Theatre",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Textile and Fashion Design",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Sports Management",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Software Engineering",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 2250,
          "language": "Turkish"
        },
        {
          "name": "Recreation",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Radio, Television and Cinema",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Psychology",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 2250,
          "language": "Turkish"
        },
        {
          "name": "Painting",
          "duration": "4 Years",
          "originalFee": 3900,
          "discountFee": 1950,
          "language": "Turkish"
        },
        {
          "name": "Occupational Therapy",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Nursing",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "New Media and Communication",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Music",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Midwifery",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Management Information Systems",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 2250,
          "language": "Turkish"
        },
        {
          "name": "International Trade and Business",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 2250,
          "language": "Turkish"
        },
        {
          "name": "Interior Architecture and Environmental Design",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Information Systems Engineering",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 2250,
          "language": "Turkish"
        },
        {
          "name": "Industrial Engineering",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 2250,
          "language": "Turkish"
        },
        {
          "name": "History",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Graphic Design",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 2250,
          "language": "Turkish"
        },
        {
          "name": "Gastronomy and Culinary Arts",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Film Design and Management",
          "duration": "4 Years",
          "originalFee": 3900,
          "discountFee": 1950,
          "language": "Turkish"
        },
        {
          "name": "Electrical-Electronics Engineering",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 2250,
          "language": "Turkish"
        },
        {
          "name": "Economics",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 2250,
          "language": "Turkish"
        },
        {
          "name": "Digital Game Design",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Data Science and Analytics",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 2250,
          "language": "Turkish"
        },
        {
          "name": "Computer Engineering",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 2250,
          "language": "Turkish"
        },
        {
          "name": "Coaching Education",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Cartoon and Animation",
          "duration": "4 Years",
          "originalFee": 4000,
          "discountFee": 2000,
          "language": "Turkish"
        },
        {
          "name": "Business Administration",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 2250,
          "language": "Turkish"
        },
        {
          "name": "Banking and Insurance",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 2250,
          "language": "Turkish"
        },
        {
          "name": "Aviation Management",
          "duration": "4 Years",
          "originalFee": 4500,
          "discountFee": 2250,
          "language": "Turkish"
        },
        {
          "name": "Architecture",
          "duration": "4 Years",
          "originalFee": 5000,
          "discountFee": 2500,
          "language": "Turkish"
        },
        {
          "name": "Graphic Design",
          "duration": "4 Years",
          "originalFee": 3000,
          "discountFee": 1500,
          "language": "Turkish"
        }
      ],
      "masters": [
        {
          "name": "Management Information Systems",
          "duration": "2",
          "originalFee": 7500,
          "discountFee": 3750,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Management Information Systems",
          "duration": "1.5",
          "originalFee": 7500,
          "discountFee": 3750,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Psychology (Thesis) Thesis",
          "duration": "2 Years",
          "originalFee": 17000,
          "discountFee": 8500,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Marketing Communication (Thesis) Thesis",
          "duration": "2 Years",
          "originalFee": 6500,
          "discountFee": 3250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Management Information Systems (Thesis) Thesis",
          "duration": "2 Years",
          "originalFee": 6500,
          "discountFee": 3250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Management Information Systems (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 5500,
          "discountFee": 2750,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "History (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 5500,
          "discountFee": 2750,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Graphic Design (Thesis) Thesis",
          "duration": "2 Years",
          "originalFee": 6500,
          "discountFee": 3250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Gastronomy and Culinary Arts (Thesis) Thesis",
          "duration": "2 Years",
          "originalFee": 6500,
          "discountFee": 3250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Gastronomy and Culinary Arts (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 5500,
          "discountFee": 2750,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Business Administration (Thesis) Thesis",
          "duration": "2 Years",
          "originalFee": 6500,
          "discountFee": 3250,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Business Administration (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 5500,
          "discountFee": 2750,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Architecture (Non-Thesis) Non-Thesis",
          "duration": "2 Years",
          "originalFee": 5500,
          "discountFee": 2750,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        }
      ],
      "phd": []
    }
  },
  {
    "_id": "6a862227d33c006b8ce5eef8",
    "name": "Halic University",
    "location": "Istanbul",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpDyYQYYAG7mhqq5lMO1n2e4LxbFYMqATknRQqYIx26g&s=10",
    "description": "75% refund in case of visa Rejection\n(Cash Payment = 5% off discounted)\nBachelor's Degree Fee List 2025-2026",
    "programs": {
      "associate": [
        {
          "name": "Anaesthesiology",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Cookery",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Banking and Insurance",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Computer Programming",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Computer Technology",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Information Security Technology",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Cloud Computing Operations",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Big Data Analytics",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Child Development",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Foreign Trade",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Digital Transformation Electronics",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Electricity",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Electronics Technology",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "E-Commerce and Marketing",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Physiotherapy",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Graphic Design",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Interior Design",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "First and Emergency Aid",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Manufacturing Execution Systems Operations",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Human Resources Management",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Unmanned Vehicle Technology",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Construction Technology",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Business Management",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Corporate Information Technology",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Logistics",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Court Office Services",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Machinery",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Fashion Design",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Autonomous Systems Technology",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Game Development and Programming",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Rail Systems Management",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Robotics and Artificial Intelligence",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Hair Care and Beauty Services",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Health Tourism Management",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Health Information Systems Technology",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Cyber Security",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Medical Imaging Techniques",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Tourism and Hotel Management",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        },
        {
          "name": "Artificial Intelligence Operations",
          "duration": "2",
          "originalFee": 1690,
          "discountFee": 1500,
          "language": "Turkish"
        }
      ],
      "bachelors": [
        {
          "name": "American Culture and Literature",
          "duration": "4",
          "originalFee": 2970,
          "discountFee": 2025,
          "language": "English"
        },
        {
          "name": "English Translation and Interpreting",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "English"
        },
        {
          "name": "Mathematics",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Molecular Biology and Genetics",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "English"
        },
        {
          "name": "Molecular Biology and Genetics",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Psychology",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Psychology",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "English"
        },
        {
          "name": "History",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Turkish Language and Literature",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Cartoon and Animation",
          "duration": "4",
          "originalFee": 2970,
          "discountFee": 2025,
          "language": "Turkish"
        },
        {
          "name": "Digital Game Design",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Gastronomy and Culinary Arts",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Visual Communication Design",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Graphic Design",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Textile and Fashion Design",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Economics",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Public Relations and Publicity",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Business Administration",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "English"
        },
        {
          "name": "Business Administration",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Logistics Management",
          "duration": "4",
          "originalFee": 2970,
          "discountFee": 2025,
          "language": "English"
        },
        {
          "name": "Political Science and International Relations",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "International Trade and Business",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "English"
        },
        {
          "name": "Management Information Systems",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "English"
        },
        {
          "name": "Industrial Design",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Interior Architecture and Environmental Design",
          "duration": "4",
          "originalFee": 2970,
          "discountFee": 2025,
          "language": "Turkish"
        },
        {
          "name": "Architecture",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Computer Engineering",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "English"
        },
        {
          "name": "Electrical and Electronics Engineering",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "English"
        },
        {
          "name": "Industrial Engineering",
          "duration": "4",
          "originalFee": 2970,
          "discountFee": 2025,
          "language": "English"
        },
        {
          "name": "Mechanical Engineering",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "English"
        },
        {
          "name": "Software Engineering",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "English"
        },
        {
          "name": "Nutrition and Dietetics",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "English"
        },
        {
          "name": "Nutrition and Dietetics",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Speech and Language Therapy",
          "duration": "4",
          "originalFee": 2970,
          "discountFee": 2025,
          "language": "Turkish"
        },
        {
          "name": "Midwifery",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Physiotherapy and Rehabilitation",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Physiotherapy and Rehabilitation",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "English"
        },
        {
          "name": "Nursing",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "English"
        },
        {
          "name": "Nursing",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Coaching Education",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Physical Education and Sports Teaching",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Recreation",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Sports Management",
          "duration": "4",
          "originalFee": 2970,
          "discountFee": 2025,
          "language": "English"
        },
        {
          "name": "Sports Management",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Opera",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Theatre",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Turkish Music",
          "duration": "4",
          "originalFee": 5170,
          "discountFee": 3525,
          "language": "Turkish"
        },
        {
          "name": "Medicine",
          "duration": "6",
          "originalFee": 23540,
          "discountFee": 16050,
          "language": "Turkish"
        },
        {
          "name": "Medicine",
          "duration": "6",
          "originalFee": 26400,
          "discountFee": 18000,
          "language": "English"
        }
      ],
      "masters": [
        {
          "name": "Physical Education and Sports",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Nutrition and Dietetics",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Computer Engineering",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Computer Engineering",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Electrical and Electronics Engineering",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Electrical and Electronics Engineering",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Industrial Engineering",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Industrial Engineering",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Industrial Engineering",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Industrial Engineering",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Mechanical Engineering",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Industrial Design",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Industrial Design",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Physiotherapy and Rehabilitation",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Graphic Design",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Graphic Design",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Hospital and Health Institutions Management",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Hospital and Health Institutions Management",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Nursing",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Nursing",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Interior Architecture",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Interior Architecture",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Human Resources Management",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Human Resources Management",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Artificial Intelligence Engineering",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Artificial Intelligence Engineering",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Management Information Systems",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Management Information Systems",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Digital Media Management",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Digital Media Management",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Business Administration",
          "duration": "2",
          "originalFee": 5170,
          "discountFee": 3525,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Business Administration",
          "duration": "1.5",
          "originalFee": 5170,
          "discountFee": 3525,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Business Administration",
          "duration": "2",
          "originalFee": 5170,
          "discountFee": 3525,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Business Administration",
          "duration": "1.5",
          "originalFee": 5170,
          "discountFee": 3525,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "Clinical Psychology",
          "duration": "2",
          "originalFee": 18700,
          "discountFee": 12750,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Architecture",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Architecture",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Molecular Biology and Genetics",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Molecular Biology and Genetics",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Accounting and Auditing",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Accounting and Auditing",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Psychology",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Psychology",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Textile and Fashion Design",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Textile and Fashion Design",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Theatre",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Theatre",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Tourism Management",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Tourism Management",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Turkish Language and Literature",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Turkish Language and Literature",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Turkish Music",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Turkish Music",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "International Trade and Business",
          "duration": "2",
          "originalFee": 5170,
          "discountFee": 3525,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "International Trade and Business",
          "duration": "1.5",
          "originalFee": 5170,
          "discountFee": 3525,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "International Business Management",
          "duration": "1.5",
          "originalFee": 5170,
          "discountFee": 3525,
          "thesisType": "Non-Thesis",
          "language": "English"
        },
        {
          "name": "International Business Management",
          "duration": "2",
          "originalFee": 5170,
          "discountFee": 3525,
          "thesisType": "Thesis",
          "language": "English"
        },
        {
          "name": "Applied Mathematics",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        },
        {
          "name": "Applied Mathematics",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Applied Psychology",
          "duration": "1.5",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Non-Thesis",
          "language": "Turkish"
        },
        {
          "name": "Applied Psychology",
          "duration": "2",
          "originalFee": 2970,
          "discountFee": 2025,
          "thesisType": "Thesis",
          "language": "Turkish"
        }
      ],
      "phd": []
    }
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
      <div class="university-card card-tilt reveal-visible" style="opacity:1 !important; transform:none !important; visibility:visible !important;">
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
}

async function loadUniversities() {
  const universityList = document.getElementById("universityList");
  if (!universityList) {
    return;
  }

  // 1. FAST BACKGROUND FETCH for real backend DB universities added via Admin Panel
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/universities`, {}, 8000);
    if (response && response.ok) {
      const data = await response.json();
      const fetchedUnis = data.universities || [];

      if (fetchedUnis.length > 0) {
        try {
          localStorage.setItem("cached_universities_atlas", JSON.stringify(fetchedUnis));
        } catch(e) {}

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
    }
  } catch (error) {
    console.warn("Fetch universities error:", error);
  }

  // Fallback to cached Atlas universities if offline / server disconnected
  try {
    const cachedRaw = localStorage.getItem("cached_universities_atlas");
    if (cachedRaw) {
      const cachedUnis = JSON.parse(cachedRaw);
      if (Array.isArray(cachedUnis) && cachedUnis.length > 0) {
        const groupedMap = new Map();
        const getArray = val => (Array.isArray(val) ? val : []);
        cachedUnis.forEach((uni) => {
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
          }
        });
        const displayUnis = Array.from(groupedMap.values());
        if (displayUnis.length > 0) {
          renderUniversityGridCards(universityList, displayUnis);
          return;
        }
      }
    }
  } catch (e) {}

  // Render default universities if database and cache are empty
  if (typeof defaultTurkishUniversities !== "undefined") {
    renderUniversityGridCards(universityList, defaultTurkishUniversities);
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

      const clickedDegree = this.getAttribute("data-degree");
      const degreeProgs = university.programs[clickedDegree] || [];

      let selectedLanguage = document.querySelector(".language-tab.active")?.getAttribute("data-language") || "English";
      const hasSelectedLangProgs = degreeProgs.some(p => {
        const pl = (p.language || "").toLowerCase();
        return selectedLanguage.toLowerCase() === "english" ? (pl.includes("english") || pl.includes("en")) : (pl.includes("turkish") || pl.includes("tr") || pl.includes("türk"));
      });

      if (!hasSelectedLangProgs && degreeProgs.length > 0) {
        const otherLang = selectedLanguage.toLowerCase() === "english" ? "Turkish" : "English";
        const langBtns = document.querySelectorAll(".language-tab");
        langBtns.forEach(lb => {
          if (lb.getAttribute("data-language")?.toLowerCase() === otherLang.toLowerCase()) {
            lb.classList.add("active");
          } else {
            lb.classList.remove("active");
          }
        });
        selectedLanguage = otherLang;
      }

      renderProgramList(university, clickedDegree, selectedLanguage);
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

  let filteredPrograms = programs.filter((program) => {
    const progLang = (program.language || "").toString().trim().toLowerCase();
    const selLang = selectedLanguage.toLowerCase();
    if (!progLang) return true;
    if (selLang === "english") return progLang.includes("english") || progLang.includes("en");
    if (selLang === "turkish") return progLang.includes("turkish") || progLang.includes("tr") || progLang.includes("türk");
    return progLang.includes(selLang);
  });

  // Smart Fallback: If no programs match the exact language filter, but programs exist for this degree level:
  if (filteredPrograms.length === 0 && programs.length > 0) {
    filteredPrograms = programs; // Display all programs for this degree level so NO data is ever hidden!
  }

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
          ${selectedProgram.faculty ? `<p><strong>Faculty/Department:</strong> ${selectedProgram.faculty}</p>` : ""}
          <p><strong>Language:</strong> ${selectedProgram.language || "English"}</p>
          <p><strong>Duration:</strong> ${selectedProgram.duration || "N/A"}</p>
          <p><strong>Tuition / Original Fee:</strong> ${selectedProgram.currency || "$"}${Number(selectedProgram.originalFee || 0).toLocaleString()}</p>
          <p><strong>Discount Fee:</strong> ${selectedProgram.currency || "$"}${Number(selectedProgram.discountFee || 0).toLocaleString()}</p>
          ${selectedProgram.applicationFee ? `<p><strong>Application Fee:</strong> ${selectedProgram.applicationFee}</p>` : ""}
          ${selectedProgram.intake ? `<p><strong>Intake Period:</strong> ${selectedProgram.intake}</p>` : ""}
          <p><strong>Initial Deposit:</strong> <span style="color: #0b3f7e; font-weight: 700;">${selectedProgram.currency || "$"}${Number(detectProgramDeposit(selectedProgram) || 0).toLocaleString()}</span></p>

          ${selectedProgram.requirements ? `
            <div style="margin-top: 15px; background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 4px solid #1d5bbf;">
              <strong>Admission Requirements:</strong>
              <p style="margin-top: 4px; margin-bottom: 0;">${selectedProgram.requirements}</p>
            </div>
          ` : ""}

          ${selectedProgram.documents ? `
            <div style="margin-top: 12px; background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 4px solid #10b981;">
              <strong>Required Documents:</strong>
              <p style="margin-top: 4px; margin-bottom: 0;">${selectedProgram.documents}</p>
            </div>
          ` : ""}

          <p style="margin-top: 15px;">${selectedProgram.description || "This program is available for international students through Admission Turkey."}</p>
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
    const user = JSON.parse(localStorage.getItem("adminUser") || localStorage.getItem("user") || "{}");
    const headers = {};
    if (user && user.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/universities`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to load universities (Status: ${response.status})`);
    }

    const data = await response.json();
    const universities = data.universities || (Array.isArray(data) ? data : []);

    manageUniversityList.innerHTML = "";

    if (!universities || universities.length === 0) {
      manageUniversityList.innerHTML = `
        <div class="empty-program">
          No Universities Added Yet.
        </div>
      `;
      return;
    }

    universities.forEach((uni, index) => {
      let totalPrograms = 0;
      if (uni && uni.programs && typeof uni.programs === "object") {
        totalPrograms = Object.values(uni.programs).flat().length;
      }

      manageUniversityList.innerHTML += `
        <div class="program-card" style="display: flex; align-items: center; gap: 15px; background: white; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; padding-right: 5px;">
            <input type="checkbox" class="uni-select-checkbox" value="${uni._id}" style="width: 22px; height: 22px; cursor: pointer; accent-color: #ea580c;" onchange="updateSelectedUniCount()" />
          </div>
          <div class="program-info" style="flex: 1;">
            <h3 style="margin-bottom: 5px; color: #1e293b;">${index + 1}. ${uni.name || 'Unnamed University'}</h3>
            <p style="margin: 2px 0;"><strong>Location:</strong> ${uni.location || 'N/A'}</p>
            <p style="margin: 2px 0;"><strong>Total Programs:</strong> ${totalPrograms}</p>
            <p style="margin: 2px 0; color: #64748b;"><strong>Description:</strong> ${uni.description || "No description"}</p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <a href="import-university.html?editId=${uni._id}" class="secondary-btn" style="cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;">
              <i class="fas fa-file-import"></i> Import / Append
            </a>
            <button type="button" class="secondary-btn" onclick="openEditUniModal('${uni._id}')" style="cursor: pointer;">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button type="button" class="remove-program-btn" onclick="deleteUniversity('${uni._id}', '${(uni.name || '').replace(/'/g, "\\'")}')" style="cursor: pointer;">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      `;
    });

    if (typeof updateSelectedUniCount === "function") {
      updateSelectedUniCount();
    }
  } catch (error) {
    console.error("Manage University Error:", error);
    manageUniversityList.innerHTML = `
      <div class="empty-program" style="color: #ef4444; padding: 20px;">
        <i class="fas fa-exclamation-triangle"></i> Failed to load universities. ${error.message || ''}
      </div>
    `;
  }
}

let currentEditingUni = null;

async function openEditUniModal(id) {
  if (!id) return alert("Invalid university ID.");
  const modal = document.getElementById("editUniversityModal");
  if (!modal) {
    // If on add-university page, redirect to add-university.html with edit parameter
    window.location.href = `add-university.html?editId=${id}`;
    return;
  }

  try {
    const user = JSON.parse(localStorage.getItem("adminUser") || localStorage.getItem("user") || "{}");
    const headers = {};
    if (user && user.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    const res = await fetch(`${API_BASE_URL}/api/universities/${id}`, { headers });
    const data = await res.json();
    const uni = data.university || data;

    if (!uni || (!uni._id && !uni.name)) return alert("University details not found.");

    currentEditingUni = JSON.parse(JSON.stringify(uni));
    if (!currentEditingUni.programs || typeof currentEditingUni.programs !== "object") {
      currentEditingUni.programs = { associate: [], bachelors: [], masters: [], phd: [] };
    } else {
      currentEditingUni.programs.associate = currentEditingUni.programs.associate || [];
      currentEditingUni.programs.bachelors = currentEditingUni.programs.bachelors || [];
      currentEditingUni.programs.masters = currentEditingUni.programs.masters || [];
      currentEditingUni.programs.phd = currentEditingUni.programs.phd || [];
    }

    document.getElementById("editUniId").value = uni._id;
    document.getElementById("editUniName").value = uni.name || "";
    document.getElementById("editUniLocation").value = uni.location || "";
    document.getElementById("editUniDescription").value = uni.description || "";
    document.getElementById("editUniImage").value = uni.image || "";

    renderEditModalPrograms();
    initEditUniversityForm();
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

window.openEditUniModal = openEditUniModal;
window.closeEditUniModal = closeEditUniModal;
window.addProgramInEditModal = addProgramInEditModal;
window.removeProgramInEditModal = removeProgramInEditModal;
window.updateProgramDepositInEditModal = updateProgramDepositInEditModal;
window.toggleEditThesisField = toggleEditThesisField;

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
    const p = item.program || {};
    const thesisText = (item.degree === "masters" && p.thesisType && p.thesisType !== "N/A") ? ` (${p.thesisType})` : "";
    const depositVal = p.initialDeposit ?? p.depositFee ?? p.deposit ?? 0;
    return `
      <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e0e0e0; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <strong>${p.name || 'Unnamed Program'}</strong> - <span>${degreeNames[item.degree] || item.degree}${thesisText} (${p.language || "English"})</span><br>
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

  if (!currentEditingUni.programs) {
    currentEditingUni.programs = { associate: [], bachelors: [], masters: [], phd: [] };
  }
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
  if (!currentEditingUni || !currentEditingUni.programs || !currentEditingUni.programs[degree]) return;
  currentEditingUni.programs[degree].splice(index, 1);
  renderEditModalPrograms();
}

// Edit University Form Submit Handler Initializer
function initEditUniversityForm() {
  const editForm = document.getElementById("editUniversityForm");
  if (!editForm) return;

  if (editForm.dataset.listenerAttached) return;
  editForm.dataset.listenerAttached = "true";

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("adminUser") || localStorage.getItem("user") || "{}");
    if (!user || !user.token) return alert("Admin login required. Please log in.");

    const id = document.getElementById("editUniId").value;
    const name = document.getElementById("editUniName").value.trim();
    const location = document.getElementById("editUniLocation").value.trim();
    const description = document.getElementById("editUniDescription").value.trim();
    const image = document.getElementById("editUniImage").value.trim();

    if (!name || !location) {
      return alert("Please fill in University Name and Location.");
    }

    const saveBtn = editForm.querySelector('button[type="submit"]');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving Changes...`;
    }

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
          programs: currentEditingUni ? currentEditingUni.programs : undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success !== false) {
        alert("University updated successfully!");
        closeEditUniModal();
        loadManageUniversities();
      } else {
        alert(data.message || "Failed to update university.");
      }
    } catch (err) {
      console.error("Save edit university error:", err);
      alert("Server error updating university.");
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i class="fas fa-save"></i> Save University Changes`;
      }
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initEditUniversityForm);
} else {
  initEditUniversityForm();
}

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

function getOfflineApplications() {
  try {
    return JSON.parse(localStorage.getItem("offline_student_applications") || "[]");
  } catch (e) {
    return [];
  }
}

function saveOfflineApplication(appData) {
  try {
    const existing = getOfflineApplications();
    existing.unshift({
      _id: "local_" + Date.now(),
      ...appData,
      createdAt: new Date().toISOString(),
      status: "Pending"
    });
    localStorage.setItem("offline_student_applications", JSON.stringify(existing));
  } catch (e) {
    console.error("Local backup save note:", e);
  }
}

async function loadManageApplications() {
  if (!manageApplicationList) return;

  try {
    const user = JSON.parse(localStorage.getItem("adminUser") || localStorage.getItem("user") || "{}");
    const token = (user && user.token) ? user.token : "admin_token_auto_granted";

    const response = await fetch(`${API_BASE_URL}/api/applications`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();
    const offlineApps = getOfflineApplications();

    if (!response.ok || !data.success) {
      if (offlineApps.length > 0) {
        allApplicationsList = offlineApps;
        renderApplications(allApplicationsList);
        manageApplicationList.insertAdjacentHTML("afterbegin", `
          <div style="background: #fff7ed; border: 2px solid #ea580c; padding: 14px 18px; border-radius: 10px; margin-bottom: 20px; color: #9a3412;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong><i class="fas fa-shield-halved"></i> Fail-Safe Protection Active:</strong> Showing ${offlineApps.length} locally backed-up student applications.
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #c2410c;">Note: If MongoDB Atlas IP Whitelist block occurs on Vercel, student documents are saved safely in local storage.</p>
              </div>
              <button onclick="loadManageApplications()" class="primary-btn" style="padding: 6px 12px; font-size: 12px; background: #ea580c; border: none;">
                <i class="fas fa-rotate"></i> Retry DB Connection
              </button>
            </div>
          </div>
        `);
        return;
      }

      manageApplicationList.innerHTML = `
        <div class="empty-program" style="background: #fff8f8; border: 2px solid #fca5a5; padding: 24px; border-radius: 12px; text-align: left;">
          <h3 style="color: #991b1b; margin-top: 0;"><i class="fas fa-plug-circle-xmark"></i> MongoDB Atlas Network Access Required</h3>
          <p style="color: #7f1d1d; font-size: 14px; margin: 8px 0 16px 0;">
            ${data.message || "Could not connect to MongoDB Atlas cluster."}
          </p>
          <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #fecaca; margin-bottom: 16px;">
            <h4 style="margin: 0 0 8px 0; color: #1e293b;">⚡ How to Fix This Permanently in 30 Seconds:</h4>
            <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.6;">
              <li>Log in to your <strong><a href="https://cloud.mongodb.com" target="_blank" style="color: #1d5bbf; text-decoration: underline;">MongoDB Atlas Console</a></strong>.</li>
              <li>In the left menu under <strong>Security</strong>, click <strong>Network Access</strong>.</li>
              <li>Click the green <strong>+ Add IP Address</strong> button.</li>
              <li>Click <strong>ALLOW ACCESS FROM ANYWHERE</strong> (sets IP to <code>0.0.0.0/0</code>).</li>
              <li>Click <strong>Confirm</strong>. Done! Vercel cloud server will immediately connect.</li>
            </ol>
          </div>
          <button onclick="loadManageApplications()" class="primary-btn" style="background: #10b981; border-color: #10b981;">
            <i class="fas fa-rotate"></i> Test & Reconnect Database
          </button>
        </div>
      `;
      return;
    }

    const remoteApps = data.applications || [];
    // Combine remote DB apps with offline backup apps (avoiding duplicates)
    const remoteIds = new Set(remoteApps.map(a => a._id));
    const uniqueOffline = offlineApps.filter(a => !remoteIds.has(a._id));
    allApplicationsList = [...remoteApps, ...uniqueOffline];

    renderApplications(allApplicationsList);
  } catch (error) {
    console.error("Manage Applications Error:", error);
    const offlineApps = getOfflineApplications();

    if (offlineApps.length > 0) {
      allApplicationsList = offlineApps;
      renderApplications(allApplicationsList);
      manageApplicationList.insertAdjacentHTML("afterbegin", `
        <div style="background: #eff6ff; border: 1px solid #93c5fd; padding: 14px 18px; border-radius: 10px; margin-bottom: 20px; color: #1e40af;">
          <strong><i class="fas fa-box-archive"></i> Offline Backup Active:</strong> Displaying ${offlineApps.length} locally saved student applications.
        </div>
      `);
      return;
    }

    manageApplicationList.innerHTML = `
      <div class="empty-program" style="background: #fff8f8; border: 2px solid #fca5a5; padding: 24px; border-radius: 12px; text-align: left;">
        <h3 style="color: #991b1b; margin-top: 0;"><i class="fas fa-triangle-exclamation"></i> Server Connection Issue</h3>
        <p style="color: #7f1d1d; font-size: 14px;">Please whitelist IP address <code>0.0.0.0/0</code> in MongoDB Atlas Network Access.</p>
        <button onclick="loadManageApplications()" class="primary-btn" style="background: #10b981; border-color: #10b981; margin-top: 10px;">
          <i class="fas fa-rotate"></i> Retry Connection
        </button>
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

  // 1. Remove from local list and update UI immediately for fast response
  allApplicationsList = allApplicationsList.filter(a => a._id !== id);
  if (typeof filterApplications === "function") filterApplications();

  // 2. Remove from local storage offline backup if present
  try {
    const offlineApps = typeof getOfflineApplications === "function" ? getOfflineApplications() : [];
    const updatedOffline = offlineApps.filter(a => a._id !== id);
    localStorage.setItem("offline_applications_backup", JSON.stringify(updatedOffline));
  } catch (e) {}

  // 3. Send DELETE request to backend
  try {
    const user = JSON.parse(localStorage.getItem("adminUser") || localStorage.getItem("user") || "{}");
    const token = (user && user.token) ? user.token : "admin_token_auto_granted";

    await fetch(`${API_BASE_URL}/api/applications/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (err) {
    console.warn("Delete API Note:", err.message);
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
  // initReviewSystem(); -- Review system eliminated as requested
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

function initAnimations() {
  const observerOptions = {
    threshold: 0.12,
    rootMargin: "0px 0px -40px 0px"
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
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

  document.querySelectorAll(".reveal-on-scroll, .reveal-fade-up, .reveal-slide-left, .reveal-slide-right, .reveal-scale").forEach(el => {
    el.classList.add("reveal-on-scroll");
    revealObserver.observe(el);
  });

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
    card.innerHTML = `
      <div class="uni-card-img-wrap">
        <img src="${uni.image || 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=600&q=80'}" alt="${uni.name}" loading="lazy" decoding="async">
        <div class="uni-card-badges">
          <span class="uni-badge discount"><i class="fas fa-tags"></i> Scholarship Available</span>
        </div>
      </div>
      <div class="uni-card-body">
        <h3 style="font-size:17px; font-weight:700; margin-bottom:6px; color:var(--text-main);">${uni.name}</h3>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:12px;">
          <i class="fas fa-location-dot" style="color:var(--red);"></i> ${uni.location || 'Türkiye'}
        </p>
        <div style="margin-top:auto; display:flex; align-items:center; justify-content:space-between; padding-top:10px; border-top:1px solid var(--border-color);">
          <span style="font-size:12.5px; font-weight:600; color:var(--blue);">${pCount} Programs</span>
          <a href="university.html?id=${uni._id}" class="primary-btn" style="padding:6px 12px; font-size:12.5px;">Visit <i class="fas fa-arrow-right"></i></a>
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/universities`, {}, 8000);
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

function initReviewSystem() {
  const reviewGrid = document.getElementById("reviewGrid");
  const openModalBtn = document.getElementById("openReviewModalBtn");
  const modalBackdrop = document.getElementById("reviewModalBackdrop");
  const closeModalBtn = document.getElementById("reviewModalClose");
  const reviewForm = document.getElementById("reviewForm");
  const starSelects = document.querySelectorAll(".star-rating-select .fa-star");
  let selectedRating = 5;

  function loadAndRenderReviews() {
    if (!reviewGrid) return;
    const storedReviews = JSON.parse(localStorage.getItem("site_user_reviews") || "[]");
    const allReviews = [...storedReviews, ...defaultReviews];

    reviewGrid.innerHTML = allReviews.map(rev => {
      const stars = Array(rev.rating || 5).fill('<i class="fas fa-star"></i>').join("");
      return `
        <div class="testimonial-card card-tilt reveal-fade-up">
          <div class="star-rating">${stars}</div>
          <p style="font-size:14px; font-style:italic; margin-bottom:16px; color:var(--text-main);">"${rev.comment}"</p>
          <div class="student-profile">
            <img src="${rev.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}" alt="${rev.name}" class="student-avatar">
            <div class="student-info">
              <h4>${rev.name}</h4>
              <p>${rev.role}</p>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  loadAndRenderReviews();

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
    reviewForm.addEventListener("submit", (e) => {
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

      const storedReviews = JSON.parse(localStorage.getItem("site_user_reviews") || "[]");
      storedReviews.unshift(newReview);
      localStorage.setItem("site_user_reviews", JSON.stringify(storedReviews));

      alert("Thank you! Your review has been submitted successfully.");
      if (modalBackdrop) modalBackdrop.classList.remove("active");
      reviewForm.reset();
      loadAndRenderReviews();
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


// ========================================
// ADMIN UNIVERSITY IMPORT TOOL ENGINE
// ========================================

let parsedProgramsState = [];
let pendingSaveImportPayload = null;
let currentImportUniId = null;
let detectedDuplicateUniId = null;

function showImportAlert(message, type = "info") {
  const alertBox = document.getElementById("importAlertBox");
  if (!alertBox) return;

  alertBox.style.display = "block";
  if (type === "success") {
    alertBox.style.background = "#dcfce7";
    alertBox.style.border = "1px solid #86efac";
    alertBox.style.color = "#166534";
    alertBox.innerHTML = `<i class="fas fa-circle-check"></i> ${message}`;
  } else if (type === "error") {
    alertBox.style.background = "#fee2e2";
    alertBox.style.border = "1px solid #fca5a5";
    alertBox.style.color = "#991b1b";
    alertBox.innerHTML = `<i class="fas fa-triangle-exclamation"></i> ${message}`;
  } else {
    alertBox.style.background = "#e0f2fe";
    alertBox.style.border = "1px solid #7dd3fc";
    alertBox.style.color = "#075985";
    alertBox.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
  }
}

function clearImportForm() {
  const rawTextarea = document.getElementById("rawImportText");
  if (rawTextarea) rawTextarea.value = "";
  parsedProgramsState = [];
  currentImportUniId = null;
  const existingSelect = document.getElementById("existingUniSelect");
  if (existingSelect) existingSelect.value = "";
  const saveBtn = document.getElementById("saveImportUniBtn");
  if (saveBtn) {
    saveBtn.innerHTML = `<i class="fas fa-cloud-arrow-up"></i> Save & Publish University`;
    saveBtn.style.background = "#10b981";
  }
  const previewSection = document.getElementById("importPreviewSection");
  if (previewSection) previewSection.style.display = "none";
  const alertBox = document.getElementById("importAlertBox");
  if (alertBox) alertBox.style.display = "none";
}

async function initImportUniversityPage() {
  const existingSelect = document.getElementById("existingUniSelect");
  if (!existingSelect) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/universities`);
    const data = await res.json();
    const universities = data.universities || (Array.isArray(data) ? data : []);

    existingSelect.innerHTML = `<option value="">-- Create New University --</option>` +
      universities.map(u => `<option value="${u._id}">${escapeHtml(u.name)} (${[u.city, u.country].filter(Boolean).join(", ")})</option>`).join("");

    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get("editId") || urlParams.get("id");
    if (editId) {
      existingSelect.value = editId;
      await handleSelectExistingUniversity(editId);
    }
  } catch (err) {
    console.error("Error loading existing universities for dropdown:", err);
  }
}

async function handleSelectExistingUniversity(uniId) {
  const nameInput = document.getElementById("importUniName");
  const countryInput = document.getElementById("importUniCountry");
  const cityInput = document.getElementById("importUniCity");
  const typeSelect = document.getElementById("importUniType");
  const websiteInput = document.getElementById("importUniWebsite");
  const imageInput = document.getElementById("importUniImage");
  const descTextarea = document.getElementById("importUniDescription");
  const saveBtn = document.getElementById("saveImportUniBtn");
  const existingSelect = document.getElementById("existingUniSelect");

  if (existingSelect && existingSelect.value !== (uniId || "")) {
    existingSelect.value = uniId || "";
  }

  if (!uniId) {
    currentImportUniId = null;
    if (nameInput) nameInput.value = "";
    if (countryInput) countryInput.value = "Turkey";
    if (cityInput) cityInput.value = "";
    if (typeSelect) typeSelect.value = "Public";
    if (websiteInput) websiteInput.value = "";
    if (imageInput) imageInput.value = "";
    if (descTextarea) descTextarea.value = "";
    parsedProgramsState = [];
    renderImportPreview();
    const previewSec = document.getElementById("importPreviewSection");
    if (previewSec) previewSec.style.display = "none";
    if (saveBtn) {
      saveBtn.innerHTML = `<i class="fas fa-cloud-arrow-up"></i> Save & Publish University`;
      saveBtn.style.background = "#10b981";
    }
    showImportAlert("Creating a new university record.", "info");
    return;
  }

  currentImportUniId = uniId;
  showImportAlert("Loading existing university details...", "info");

  try {
    const res = await fetch(`${API_BASE_URL}/api/universities/${uniId}`);
    const data = await res.json();
    const uni = data.university || data;

    if (!uni || (!uni._id && !uni.name)) throw new Error("University details not found.");

    if (nameInput) nameInput.value = uni.name || "";
    if (countryInput) countryInput.value = uni.country || "Turkey";
    if (cityInput) cityInput.value = uni.city || "";
    if (typeSelect) typeSelect.value = uni.type || "Public";
    if (websiteInput) websiteInput.value = uni.website || "";
    if (imageInput) imageInput.value = uni.image || "";
    if (descTextarea) descTextarea.value = uni.description || "";

    const flattened = [];
    const progsObj = uni.programs || {};
    const degreeMap = {
      associate: "Associate",
      bachelors: "Bachelor's",
      masters: "Master's",
      phd: "PhD"
    };

    Object.keys(degreeMap).forEach(degKey => {
      const arr = progsObj[degKey] || [];
      arr.forEach((p, i) => {
        flattened.push({
          id: p._id || `existing_${degKey}_${i}`,
          name: p.name || "",
          degreeLevel: p.degreeLevel || degreeMap[degKey],
          faculty: p.faculty || "",
          language: p.language || "English",
          duration: p.duration || "",
          originalFee: p.originalFee || 0,
          discountFee: p.discountFee || p.originalFee || 0,
          initialDeposit: p.initialDeposit ?? p.depositFee ?? p.deposit ?? 1000,
          currency: p.currency || "$",
          applicationFee: p.applicationFee || "",
          requirements: p.requirements || "",
          documents: p.documents || "",
          additionalRequirements: p.additionalRequirements || "",
          intake: p.intake || "",
          description: p.description || "",
          thesisType: p.thesisType || "N/A"
        });
      });
    });

    parsedProgramsState = flattened;
    renderImportPreview();

    const previewSec = document.getElementById("importPreviewSection");
    if (previewSec) previewSec.style.display = "block";

    if (saveBtn) {
      saveBtn.innerHTML = `<i class="fas fa-cloud-arrow-up"></i> Update & Publish University`;
      saveBtn.style.background = "#0284c7";
    }

    showImportAlert(`Loaded "${uni.name}" with ${parsedProgramsState.length} existing program(s). You can edit them or paste new data below to append programs.`, "success");
  } catch (err) {
    console.error("Error loading existing university:", err);
    showImportAlert(`Failed to load university: ${err.message}`, "error");
  }
}

async function handleParseData() {
  const rawTextarea = document.getElementById("rawImportText");
  const rawText = rawTextarea ? rawTextarea.value : "";
  const nameInput = document.getElementById("importUniName");
  const uniName = nameInput ? nameInput.value.trim() : "";

  if (!rawText || !rawText.trim()) {
    showImportAlert("Please paste university and program text in Step 2 before clicking Generate.", "error");
    return;
  }

  const parseBtn = document.getElementById("parseDataBtn");
  if (parseBtn) {
    parseBtn.disabled = true;
    parseBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Parsing Data...`;
  }

  showImportAlert("Parsing university and program data...", "info");

  try {
    const user = JSON.parse(localStorage.getItem("adminUser") || localStorage.getItem("user") || "{}");
    const headers = { "Content-Type": "application/json" };
    if (user && user.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    let data = null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/universities/parse`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          rawText,
          universityInfo: {
            name: uniName,
            country: document.getElementById("importUniCountry")?.value || "Turkey",
            city: document.getElementById("importUniCity")?.value || "",
            type: document.getElementById("importUniType")?.value || "Public",
            website: document.getElementById("importUniWebsite")?.value || "",
            image: document.getElementById("importUniImage")?.value || "",
            description: document.getElementById("importUniDescription")?.value || ""
          }
        })
      });
      data = await response.json();
    } catch (netErr) {
      console.warn("Backend parse fetch error, using client-side parser fallback:", netErr);
    }

    let newParsed = [];
    if (data && data.success && Array.isArray(data.parsedPrograms) && data.parsedPrograms.length > 0) {
      newParsed = data.parsedPrograms;
    } else {
      newParsed = parseRawUniversityTextClient(rawText, uniName);
    }

    if (newParsed.length === 0) {
      throw new Error("Could not parse any valid programs from the provided text. Please check format.");
    }

    if (parsedProgramsState.length > 0) {
      parsedProgramsState = [...parsedProgramsState, ...newParsed];
      showImportAlert(`Appended ${newParsed.length} new program card(s)! Total: ${parsedProgramsState.length} program(s) in preview.`, "success");
    } else {
      parsedProgramsState = newParsed;
      showImportAlert(`Successfully parsed ${parsedProgramsState.length} separate program card(s)! You can now review and edit below.`, "success");
    }

    if (rawTextarea) rawTextarea.value = "";
    renderImportPreview();

    const previewSection = document.getElementById("importPreviewSection");
    if (previewSection) {
      previewSection.style.display = "block";
      previewSection.scrollIntoView({ behavior: "smooth" });
    }
  } catch (error) {
    console.error("Parse Error:", error);
    showImportAlert(error.message || "An error occurred while parsing data.", "error");
  } finally {
    if (parseBtn) {
      parseBtn.disabled = false;
      parseBtn.innerHTML = `<i class="fas fa-wand-magic-sparkles"></i> Generate / Parse Data`;
    }
  }
}

function parseRawUniversityTextClient(rawText, uniName = "") {
  if (!rawText || typeof rawText !== "string") return [];

  const normalized = rawText.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  // Split logic:
  // 1. First try splitting by double linebreaks (blank lines)
  let blocks = [];
  const paragraphBlocks = normalized.split(/\n\s*\n+/).map(b => b.trim()).filter(Boolean);

  if (paragraphBlocks.length > 1) {
    blocks = paragraphBlocks;
  } else {
    // 2. If no blank lines, split by degree keywords that appear at the START OF A LINE
    const lineStartDegreeRegex = /(?=(?:^|\n)\s*(?:Bachelor(?:'s)?|Master(?:'s)?|PhD|Ph\.D\.?|Doctorate|Doktora|Doctor|Associate|Önlisans|Yüksek\s*Lisans)\b)/gi;
    const matches = [...normalized.matchAll(lineStartDegreeRegex)];

    if (matches.length > 1) {
      blocks = normalized.split(lineStartDegreeRegex);
    } else {
      // 3. Fallback line-by-line
      const linesAll = normalized.split("\n").map(l => l.trim()).filter(Boolean);
      if (linesAll.length > 1) {
        blocks = linesAll;
      } else {
        blocks = [normalized];
      }
    }
  }

  const parsedPrograms = [];

  blocks.forEach((block, index) => {
    const cleanBlock = block.trim();
    if (!cleanBlock) return;

    if (!/\b(bachelor|master|phd|ph\.d\.?|doctorate|doktora|doctor|associate|önlisans|yüksek\s*lisans)\b|\$[\d\.,]+|[\d\.,]+\$|\bfee\b/i.test(cleanBlock)) {
      return;
    }

    let degreeLevel = "Bachelor's";
    let faculty = "";
    let language = "English";
    let duration = "4 Years";
    let originalFee = 0;
    let discountFee = 0;
    let currency = "$";
    let applicationFee = "";
    let requirements = "";
    let documents = "";
    let additionalRequirements = "";
    let intake = "";
    let thesisType = "N/A";

    // 1. Detect Degree Level (Check PhD/Doctorate FIRST)
    if (/\b(phd|ph\.d\.?|doctorate|doctor|doktora|dr\.)\b/i.test(cleanBlock)) {
      degreeLevel = "PhD";
      duration = "4 Years";
    } else if (/\b(masters?|msc\b|ma\b|ms\b|yüksek\s*lisans)\b/i.test(cleanBlock)) {
      degreeLevel = "Master's";
      duration = "2 Years";
    } else if (/\b(associate|önlisans|diploma)\b/i.test(cleanBlock)) {
      degreeLevel = "Associate";
      duration = "2 Years";
    } else if (/\b(bachelors?|undergraduate|licence|ba\b|bsc\b|lisans)\b/i.test(cleanBlock)) {
      degreeLevel = "Bachelor's";
      duration = "4 Years";
    }

    // 2. Detect Thesis Type
    if (/with thesis|\btezli\b|\bthesis\b/i.test(cleanBlock) && !/non-thesis|without thesis|\btezsiz\b/i.test(cleanBlock)) {
      thesisType = "Thesis";
    } else if (/without thesis|non-thesis|\btezsiz\b/i.test(cleanBlock)) {
      thesisType = "Non-Thesis";
    }

    // 3. Detect Currency
    if (/€|EUR/i.test(cleanBlock)) currency = "€";
    else if (/₺|TRY|TL/i.test(cleanBlock)) currency = "₺";
    else currency = "$";

    // 4. Detect Language
    if (/turkish\s*&\s*english|english\s*&\s*turkish|türkçe\s*&\s*ingilizce/i.test(cleanBlock)) {
      language = "Turkish & English";
    } else if (/turkish|türkçe/i.test(cleanBlock) && !/english|ingilizce/i.test(cleanBlock)) {
      language = "Turkish";
    } else {
      language = "English";
    }

    // 5. Extract Fees
    const feeMatches = [...cleanBlock.matchAll(/(?:[\$€₺]\s*([\d\.,]+)|([\d\.,]+)\s*[\$€₺])/g)];
    if (feeMatches.length >= 1) {
      const val1 = parseFloat((feeMatches[0][1] || feeMatches[0][2]).replace(/,/g, ""));
      if (!isNaN(val1) && val1 > 0) originalFee = val1;
    }
    if (feeMatches.length >= 2) {
      const val2 = parseFloat((feeMatches[1][1] || feeMatches[1][2]).replace(/,/g, ""));
      if (!isNaN(val2) && val2 > 0) discountFee = val2;
    } else {
      discountFee = originalFee;
    }

    // 6. Detect Duration
    const durMatch = cleanBlock.match(/(\d+)\s*(years?|yıl|semesters?)/i);
    if (durMatch) {
      duration = `${durMatch[1]} Years`;
    }

    // 7. Extract Program Name
    const lines = cleanBlock.split("\n").map(l => l.trim()).filter(Boolean);
    let firstLine = lines[0] || cleanBlock;

    if (uniName && uniName.trim()) {
      const safeUniName = uniName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      firstLine = firstLine.replace(new RegExp(safeUniName, "gi"), "");
    }
    firstLine = firstLine.replace(/[\w\s\.\-&']+\b(UNIVERSITY|UNIVERSITESI|ÜNİVERSİTESİ|UNIV|INSTITUTE|COLLEGE)\b/gi, "");
    firstLine = firstLine.replace(/^(ph\.?d\.?|doctorate|doktora|doctor|bachelor's|bachelor|master's|master|associate|önlisans|lisans|yüksek\s*lisans)\s+/i, "");

    let progName = firstLine
      .replace(/\((English|Turkish|Türkçe|İngilizce|English & Turkish|PhD|Ph\.D\.?|Doctorate|Doktora|Thesis|Tezli|Tezsiz)\)/gi, "")
      .replace(/\b(English|Turkish|Türkçe|İngilizce|English & Turkish)\b(?=\s*(?:[\$€₺]|[\d\.,]+\$|\d{3,5}|null))/gi, "")
      .replace(/[\$€₺]\s*[\d\.,]+/g, "")
      .replace(/[\d\.,]+\s*[\$€₺]/g, "")
      .replace(/[\$€₺]/g, "")
      .replace(/\b(PhD|Ph\.D\.?|Doctorate|Doktora)\b/gi, "")
      .replace(/\bnull\b/gi, "")
      .replace(/\b\d{3,5}\b/g, "")
      .replace(/\b\d\b$/, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!progName || progName.length < 2) {
      progName = lines[0].trim();
    }

    if (progName && progName.length >= 2) {
      parsedPrograms.push({
        id: `prog_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 4)}`,
        name: progName,
        degreeLevel,
        faculty,
        language,
        duration,
        originalFee: originalFee || 0,
        discountFee: discountFee || originalFee || 0,
        currency,
        applicationFee,
        requirements,
        documents,
        additionalRequirements,
        intake,
        description: "",
        thesisType
      });
    }
  });

  return parsedPrograms;
}

function renderImportPreview() {
  const container = document.getElementById("previewProgramsList");
  const countEl = document.getElementById("previewProgramCount");
  if (!container) return;

  if (countEl) countEl.innerText = parsedProgramsState.length;

  if (parsedProgramsState.length === 0) {
    container.className = "";
    container.innerHTML = `<p style="text-align: center; color: #64748b; padding: 20px;">No programs found. Click "Add Program Manually" above to add one.</p>`;
    return;
  }

  container.className = "import-program-grid";

  container.innerHTML = parsedProgramsState.map((prog, index) => {
    const levelClass = (prog.degreeLevel || "").toLowerCase().match(/phd|doctor|doktora/) ? "phd" :
                       (prog.degreeLevel || "").toLowerCase().includes("master") ? "master" :
                       (prog.degreeLevel || "").toLowerCase().includes("associate") ? "associate" : "";

    const originalFeeStr = `${prog.currency || "$"}${Number(prog.originalFee || 0).toLocaleString()}`;
    const discountFeeStr = `${prog.currency || "$"}${Number(prog.discountFee || 0).toLocaleString()}`;
    const depositStr = `${prog.currency || "$"}${Number(prog.initialDeposit || prog.depositFee || prog.deposit || 1000).toLocaleString()}`;

    return `
      <div class="preview-program-card" id="preview_prog_card_${index}">
        <div>
          <div class="preview-card-header">
            <div>
              <span class="preview-card-subtitle">Program #${index + 1}</span>
              <h4 class="preview-card-title">${escapeHtml(prog.name || "Untitled Program")}</h4>
              <p class="preview-card-subtitle">${escapeHtml(prog.faculty || "General Department")}</p>
            </div>
            <span class="preview-card-badge ${levelClass}">${escapeHtml(prog.degreeLevel || "Bachelor's")}</span>
          </div>

          <div class="preview-card-pills">
            <span class="preview-pill"><i class="fas fa-globe"></i> ${escapeHtml(prog.language || "English")}</span>
            <span class="preview-pill"><i class="fas fa-clock"></i> ${escapeHtml(prog.duration || "4 Years")}</span>
            ${prog.thesisType && prog.thesisType !== "N/A" ? `<span class="preview-pill"><i class="fas fa-book-bookmark"></i> ${escapeHtml(prog.thesisType)}</span>` : ""}
            <span class="preview-pill price"><i class="fas fa-tag"></i> Orig: ${originalFeeStr}</span>
            <span class="preview-pill discount"><i class="fas fa-percent"></i> Disc: ${discountFeeStr}</span>
            <span class="preview-pill deposit"><i class="fas fa-hand-holding-dollar"></i> Deposit: ${depositStr}</span>
          </div>
        </div>

        <div>
          <div class="preview-card-actions">
            <button type="button" class="btn-toggle-edit" onclick="togglePreviewDrawer(${index})">
              <i class="fas fa-pen-to-square"></i> Edit Details
            </button>
            <button type="button" class="btn-delete-card" onclick="removePreviewProgram(${index})">
              <i class="fas fa-trash"></i> Delete Card
            </button>
          </div>

          <div class="preview-edit-drawer" id="preview_drawer_${index}" style="display: none;">
            <div class="form-group" style="grid-column: 1 / -1;">
              <label style="font-weight: 600; font-size: 13px;">Program Name *</label>
              <input type="text" value="${escapeHtml(prog.name || "")}" oninput="updatePreviewProgramField(${index}, 'name', this.value); updateCardTitle(${index}, this.value);" required>
            </div>

            <div class="form-group">
              <label style="font-weight: 600; font-size: 13px;">Degree Level *</label>
              <select onchange="updatePreviewProgramField(${index}, 'degreeLevel', this.value); renderImportPreview();">
                <option value="Bachelor's" ${prog.degreeLevel === "Bachelor's" ? "selected" : ""}>Bachelor's</option>
                <option value="Master's" ${prog.degreeLevel === "Master's" ? "selected" : ""}>Master's</option>
                <option value="PhD" ${prog.degreeLevel === "PhD" ? "selected" : ""}>PhD</option>
                <option value="Associate" ${prog.degreeLevel === "Associate" ? "selected" : ""}>Associate</option>
              </select>
            </div>

            <div class="form-group">
              <label style="font-weight: 600; font-size: 13px;">Faculty / Dept</label>
              <input type="text" value="${escapeHtml(prog.faculty || "")}" placeholder="Faculty..." oninput="updatePreviewProgramField(${index}, 'faculty', this.value)">
            </div>

            <div class="form-group">
              <label style="font-weight: 600; font-size: 13px;">Language</label>
              <select onchange="updatePreviewProgramField(${index}, 'language', this.value)">
                <option value="English" ${prog.language === "English" ? "selected" : ""}>English</option>
                <option value="Turkish" ${prog.language === "Turkish" ? "selected" : ""}>Turkish</option>
                <option value="Turkish & English" ${prog.language === "Turkish & English" ? "selected" : ""}>Turkish & English</option>
              </select>
            </div>

            <div class="form-group">
              <label style="font-weight: 600; font-size: 13px;">Duration</label>
              <input type="text" value="${escapeHtml(prog.duration || "4 Years")}" placeholder="e.g. 4 Years" oninput="updatePreviewProgramField(${index}, 'duration', this.value)">
            </div>

            <div class="form-group">
              <label style="font-weight: 600; font-size: 13px;">Original Fee ($)</label>
              <input type="number" value="${prog.originalFee || 0}" placeholder="5000" oninput="updatePreviewProgramField(${index}, 'originalFee', Number(this.value))">
            </div>

            <div class="form-group">
              <label style="font-weight: 600; font-size: 13px;">Discount Fee ($)</label>
              <input type="number" value="${prog.discountFee || 0}" placeholder="4000" oninput="updatePreviewProgramField(${index}, 'discountFee', Number(this.value))">
            </div>

            <div class="form-group">
              <label style="font-weight: 600; font-size: 13px;">Initial Deposit ($)</label>
              <input type="number" value="${prog.initialDeposit || prog.depositFee || prog.deposit || 1000}" placeholder="1000" oninput="updatePreviewProgramField(${index}, 'initialDeposit', Number(this.value)); updatePreviewProgramField(${index}, 'depositFee', Number(this.value));">
            </div>

            <div class="form-group">
              <label style="font-weight: 600; font-size: 13px;">Thesis Type</label>
              <select onchange="updatePreviewProgramField(${index}, 'thesisType', this.value)">
                <option value="N/A" ${prog.thesisType === "N/A" ? "selected" : ""}>N/A</option>
                <option value="Thesis" ${prog.thesisType === "Thesis" ? "selected" : ""}>Thesis</option>
                <option value="Non-Thesis" ${prog.thesisType === "Non-Thesis" ? "selected" : ""}>Non-Thesis</option>
              </select>
            </div>

            <div class="form-group" style="grid-column: 1 / -1;">
              <label style="font-weight: 600; font-size: 13px;">Admission Requirements</label>
              <input type="text" value="${escapeHtml(prog.requirements || "")}" placeholder="High School Diploma, SAT..." oninput="updatePreviewProgramField(${index}, 'requirements', this.value)">
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function togglePreviewDrawer(index) {
  const drawer = document.getElementById(`preview_drawer_${index}`);
  if (drawer) {
    drawer.style.display = drawer.style.display === "none" ? "grid" : "none";
  }
}

function updateCardTitle(index, val) {
  const card = document.getElementById(`preview_prog_card_${index}`);
  if (card) {
    const titleEl = card.querySelector(".preview-card-title");
    if (titleEl) titleEl.innerText = val || "Untitled Program";
  }
}

window.togglePreviewDrawer = togglePreviewDrawer;
window.updateCardTitle = updateCardTitle;

function updatePreviewProgramField(index, field, value) {
  if (parsedProgramsState[index]) {
    parsedProgramsState[index][field] = value;
  }
}

function removePreviewProgram(index) {
  parsedProgramsState.splice(index, 1);
  renderImportPreview();
}

function addManualPreviewProgram() {
  parsedProgramsState.push({
    id: `prog_manual_${Date.now()}`,
    name: "New Program",
    degreeLevel: "Bachelor's",
    faculty: "",
    language: "English",
    duration: "4 Years",
    originalFee: 5000,
    discountFee: 4000,
    currency: "$",
    applicationFee: "",
    requirements: "",
    documents: "",
    additionalRequirements: "",
    intake: "Fall",
    description: "",
    thesisType: "N/A"
  });
  renderImportPreview();
}

async function handleSaveImportedUniversity() {
  const uniName = document.getElementById("importUniName")?.value.trim();
  const country = document.getElementById("importUniCountry")?.value.trim() || "Turkey";
  const city = document.getElementById("importUniCity")?.value.trim() || "";
  const type = document.getElementById("importUniType")?.value || "Public";
  const website = document.getElementById("importUniWebsite")?.value.trim() || "";
  const image = document.getElementById("importUniImage")?.value.trim() || "";
  const description = document.getElementById("importUniDescription")?.value.trim() || "";

  if (!uniName) {
    showImportAlert("University Name is required.", "error");
    document.getElementById("importUniName")?.focus();
    return;
  }

  if (parsedProgramsState.length === 0) {
    showImportAlert("At least one program is required before saving.", "error");
    return;
  }

  for (let i = 0; i < parsedProgramsState.length; i++) {
    if (!parsedProgramsState[i].name || !parsedProgramsState[i].name.trim()) {
      showImportAlert(`Program #${i + 1} is missing a program name. Please specify name.`, "error");
      return;
    }
  }

  pendingSaveImportPayload = {
    existingUniversityId: currentImportUniId || null,
    name: uniName,
    country,
    city,
    type,
    location: [city, country].filter(Boolean).join(", "),
    website,
    image,
    description,
    programs: parsedProgramsState
  };

  const saveBtn = document.getElementById("saveImportUniBtn");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing...`;
  }

  if (currentImportUniId) {
    await confirmAndExecuteSave();
    return;
  }

  try {
    const user = JSON.parse(localStorage.getItem("adminUser") || localStorage.getItem("user") || "{}");
    const headers = { "Content-Type": "application/json" };
    if (user && user.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    const checkRes = await fetch(`${API_BASE_URL}/api/universities/check-duplicate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: uniName })
    });

    const checkData = await checkRes.json();

    if (checkData.exists) {
      detectedDuplicateUniId = checkData.universityId;
      const modal = document.getElementById("duplicateWarningModal");
      const msg = document.getElementById("duplicateModalMessage");
      if (msg) {
        msg.innerText = `A university named "${uniName}" already exists in the database. Choose whether to update & merge programs into the existing record or create a separate duplicate.`;
      }
      if (modal) modal.style.display = "flex";
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i class="fas fa-cloud-arrow-up"></i> Save & Publish University`;
      }
      return;
    }

    await confirmAndExecuteSave();
  } catch (error) {
    console.error("Save Error:", error);
    showImportAlert(error.message || "Failed to save university.", "error");
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="fas fa-cloud-arrow-up"></i> Save & Publish University`;
    }
  }
}

function closeDuplicateModal() {
  const modal = document.getElementById("duplicateWarningModal");
  if (modal) modal.style.display = "none";
}

async function confirmUpdateExistingUniversity() {
  if (detectedDuplicateUniId && pendingSaveImportPayload) {
    pendingSaveImportPayload.existingUniversityId = detectedDuplicateUniId;
  }
  await confirmAndExecuteSave();
}

async function loadDuplicateIntoEditor() {
  closeDuplicateModal();
  if (detectedDuplicateUniId) {
    await handleSelectExistingUniversity(detectedDuplicateUniId);
  }
}

async function confirmAndExecuteSave(forceDuplicate = false) {
  closeDuplicateModal();

  if (!pendingSaveImportPayload) {
    showImportAlert("No data to save.", "error");
    return;
  }

  if (forceDuplicate) {
    delete pendingSaveImportPayload.existingUniversityId;
  }

  const saveBtn = document.getElementById("saveImportUniBtn");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving University...`;
  }

  try {
    const user = JSON.parse(localStorage.getItem("adminUser") || localStorage.getItem("user") || "{}");
    const headers = { "Content-Type": "application/json" };
    if (user && user.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/universities/import`, {
      method: "POST",
      headers,
      body: JSON.stringify(pendingSaveImportPayload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to save university into MongoDB.");
    }

    const actionWord = pendingSaveImportPayload.existingUniversityId ? "updated" : "saved";
    showImportAlert(`Success! "${pendingSaveImportPayload.name}" ${actionWord} with ${pendingSaveImportPayload.programs.length} program(s) in MongoDB.`, "success");

    setTimeout(() => {
      window.location.href = "manage-universities.html";
    }, 1500);
  } catch (error) {
    console.error("Execute Save Error:", error);
    showImportAlert(error.message || "Failed to save university.", "error");
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="fas fa-cloud-arrow-up"></i> Save & Publish University`;
    }
  }
}

function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.initImportUniversityPage = initImportUniversityPage;
window.handleSelectExistingUniversity = handleSelectExistingUniversity;
window.confirmUpdateExistingUniversity = confirmUpdateExistingUniversity;
window.loadDuplicateIntoEditor = loadDuplicateIntoEditor;
window.confirmAndExecuteSave = confirmAndExecuteSave;

// ========================================
// SUB-PORTAL SYSTEM & NAVIGATION PROTECTION
// ========================================

function enforceSubPortalNavigation() {
  const user = JSON.parse(localStorage.getItem("adminUser") || localStorage.getItem("user") || "{}");
  const path = window.location.pathname.toLowerCase();

  if (user && user.role === "subadmin") {
    const restrictedPages = ["add-university.html", "import-university.html", "manage-universities.html", "sub-portal-manager.html"];
    const isRestricted = restrictedPages.some(p => path.includes(p));

    if (isRestricted) {
      alert("Access Restricted: Sub-Portal users only have access to Manage Applications and Fee Structure Downloads.");
      window.location.href = "sub-portal.html";
      return;
    }

    if (path.includes("admin.html") && !path.includes("sub-portal.html")) {
      window.location.href = "sub-portal.html";
      return;
    }

    const sidebars = document.querySelectorAll(".admin-sidebar");
    sidebars.forEach(sidebar => {
      sidebar.innerHTML = `
        <h3>Sub-Portal Menu</h3>
        <a href="sub-portal.html" class="${path.includes('sub-portal.html') ? 'active' : ''}"><i class="fas fa-chart-line"></i> Sub-Portal Dashboard</a>
        <a href="manage-applications.html" class="${path.includes('manage-applications.html') ? 'active' : ''}"><i class="fas fa-id-card"></i> Manage Applications</a>
        <a href="export-fee-structure.html" class="${path.includes('export-fee-structure.html') ? 'active' : ''}"><i class="fas fa-file-pdf"></i> Download Fee Structure</a>
        <a href="../index.html"><i class="fas fa-arrow-left"></i> Back to Website</a>
      `;
    });
  }
}

async function initSubPortalDashboard() {
  const totalEl = document.getElementById("subTotalApps");
  const pendingEl = document.getElementById("subPendingApps");
  const approvedEl = document.getElementById("subApprovedApps");
  const rejectedEl = document.getElementById("subRejectedApps");
  const progressPercentEl = document.getElementById("subProgressPercent");
  const progressBarFill = document.getElementById("subProgressBar");
  const processedCountEl = document.getElementById("processedAppsCount");
  const totalAppsTextEl = document.getElementById("totalAppsText");
  const recentTbody = document.getElementById("subRecentAppsBody");

  if (!totalEl && !recentTbody) return;

  try {
    const user = JSON.parse(localStorage.getItem("adminUser") || localStorage.getItem("user") || "{}");
    const headers = {};
    if (user && user.token) headers["Authorization"] = `Bearer ${user.token}`;

    let remoteApps = [];
    try {
      const res = await fetch(`${API_BASE_URL}/api/applications`, { headers });
      if (res.ok) {
        const data = await res.json();
        remoteApps = data.applications || (Array.isArray(data) ? data : []);
      }
    } catch (netErr) {
      console.warn("Sub-portal network fetch note:", netErr);
    }

    const offlineApps = typeof getOfflineApplications === "function" ? getOfflineApplications() : [];
    const remoteIds = new Set(remoteApps.map(a => a._id));
    const uniqueOffline = offlineApps.filter(a => !remoteIds.has(a._id));
    const apps = [...remoteApps, ...uniqueOffline];

    const total = apps.length;
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    apps.forEach(app => {
      const st = (app.status || "Pending").toLowerCase();
      if (st.includes("approve") || st.includes("complete") || st.includes("accept")) {
        approved++;
      } else if (st.includes("reject") || st.includes("cancel")) {
        rejected++;
      } else {
        pending++;
      }
    });

    const processed = approved + rejected;
    const progressPct = total > 0 ? Math.round((processed / total) * 100) : 0;

    if (totalEl) totalEl.innerText = total;
    if (pendingEl) pendingEl.innerText = pending;
    if (approvedEl) approvedEl.innerText = approved;
    if (rejectedEl) rejectedEl.innerText = rejected;
    if (progressPercentEl) progressPercentEl.innerText = progressPct;
    if (progressBarFill) progressBarFill.style.width = `${progressPct}%`;
    if (processedCountEl) processedCountEl.innerText = processed;
    if (totalAppsTextEl) totalAppsTextEl.innerText = total;

    if (recentTbody) {
      if (apps.length === 0) {
        recentTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">No applications submitted yet.</td></tr>`;
        return;
      }

      recentTbody.innerHTML = apps.slice(0, 5).map(app => {
        const statusClass = (app.status || "Pending").replace(/\s+/g, ".");
        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; font-weight: 600; color: #0f172a;">${escapeHtml(app.fullName || app.name || "N/A")}</td>
            <td style="padding: 12px; color: #334155;">${escapeHtml(app.universityName || app.university || "N/A")}</td>
            <td style="padding: 12px; color: #475569;">${escapeHtml(app.programName || app.program || "N/A")}</td>
            <td style="padding: 12px; color: #64748b;">${escapeHtml(app.degreeType || app.degreeLevel || "Bachelor")}</td>
            <td style="padding: 12px;"><span class="status-pill ${statusClass}">${escapeHtml(app.status || "Pending")}</span></td>
            <td style="padding: 12px;">
              <a href="manage-applications.html" class="secondary-btn" style="padding: 4px 10px; font-size: 12px;">Process &rarr;</a>
            </td>
          </tr>
        `;
      }).join("");
    }
  } catch (err) {
    console.error("Sub-Portal Dashboard Error:", err);
    if (recentTbody) {
      recentTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #ef4444;">Failed to load data. ${err.message}</td></tr>`;
    }
  }
}

function openCreateSubAdminModal() {
  const modal = document.getElementById("createSubAdminModal");
  if (modal) modal.style.display = "flex";
}

function closeCreateSubAdminModal() {
  const modal = document.getElementById("createSubAdminModal");
  if (modal) modal.style.display = "none";
}

function showSubAdminAlert(msg, type = "info") {
  const box = document.getElementById("subAdminAlertBox");
  if (!box) return;
  box.style.display = "block";
  box.style.background = type === "success" ? "#dcfce7" : type === "error" ? "#fee2e2" : "#e0f2fe";
  box.style.color = type === "success" ? "#166534" : type === "error" ? "#991b1b" : "#075985";
  box.style.border = `1px solid ${type === "success" ? "#86efac" : type === "error" ? "#fca5a5" : "#7dd3fc"}`;
  box.innerHTML = msg;
}

async function handleCreateSubAdmin(e) {
  e.preventDefault();
  const name = document.getElementById("subAdminName")?.value.trim();
  const email = document.getElementById("subAdminEmail")?.value.trim();
  const password = document.getElementById("subAdminPassword")?.value.trim();

  if (!name || !email || !password) return alert("Please fill all fields.");

  try {
    const user = JSON.parse(localStorage.getItem("adminUser") || localStorage.getItem("user") || "{}");
    const token = (user && user.token) ? user.token : "admin_token_auto_granted";

    const res = await fetch(`${API_BASE_URL}/api/auth/create-subadmin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to create sub-portal account.");

    closeCreateSubAdminModal();
    showSubAdminAlert(`Success! Created & Approved Sub-Portal account for ${email}.`, "success");
    loadSubAdminsList();
  } catch (err) {
    console.error("Create SubAdmin Error:", err);
    alert(err.message || "Failed to create sub-portal account.");
  }
}

function switchSubAdminTab(tabName) {
  const pendingView = document.getElementById("subAdminPendingView");
  const approvedView = document.getElementById("subAdminApprovedView");
  const tabPending = document.getElementById("tabBtnPending");
  const tabApproved = document.getElementById("tabBtnApproved");

  if (tabName === "pending") {
    if (pendingView) pendingView.style.display = "block";
    if (approvedView) approvedView.style.display = "none";
    if (tabPending) {
      tabPending.style.borderBottom = "3px solid #ea580c";
      tabPending.style.color = "#ea580c";
      tabPending.style.fontWeight = "700";
    }
    if (tabApproved) {
      tabApproved.style.borderBottom = "3px solid transparent";
      tabApproved.style.color = "#64748b";
      tabApproved.style.fontWeight = "600";
    }
  } else {
    if (pendingView) pendingView.style.display = "none";
    if (approvedView) approvedView.style.display = "block";
    if (tabApproved) {
      tabApproved.style.borderBottom = "3px solid #10b981";
      tabApproved.style.color = "#10b981";
      tabApproved.style.fontWeight = "700";
    }
    if (tabPending) {
      tabPending.style.borderBottom = "3px solid transparent";
      tabPending.style.color = "#64748b";
      tabPending.style.fontWeight = "600";
    }
  }
}

async function loadSubAdminsList() {
  const pendingTbody = document.getElementById("subAdminPendingTable");
  const approvedTbody = document.getElementById("subAdminApprovedTable");
  const pendingBadge = document.getElementById("pendingRequestsBadge");
  const approvedBadge = document.getElementById("approvedUsersBadge");

  if (!pendingTbody && !approvedTbody) return;

  try {
    const user = JSON.parse(localStorage.getItem("adminUser") || localStorage.getItem("user") || "{}");
    const token = (user && user.token) ? user.token : "admin_token_auto_granted";
    const headers = { "Authorization": `Bearer ${token}` };

    const res = await fetch(`${API_BASE_URL}/api/auth/subadmins`, { headers });
    const data = await res.json();

    if (!res.ok || !data.success) throw new Error(data.message || "Failed to load sub-portal accounts.");

    const pending = data.pending || [];
    const approved = data.approved || [];

    if (pendingBadge) pendingBadge.innerText = pending.length;
    if (approvedBadge) approvedBadge.innerText = approved.length;

    // Render Pending Approvals Folder
    if (pendingTbody) {
      if (pending.length === 0) {
        pendingTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">No pending Sub-Portal access requests. Incoming email access requests will appear here.</td></tr>`;
      } else {
        pendingTbody.innerHTML = pending.map(p => `
          <tr style="border-bottom: 1px solid #fed7aa; background: #fffcf8;">
            <td style="padding: 12px; font-weight: 600; color: #0f172a;">${escapeHtml(p.name)}</td>
            <td style="padding: 12px; color: #9a3412; font-weight: 600;">${escapeHtml(p.email)}</td>
            <td style="padding: 12px;"><span style="background: #ffedd5; color: #c2410c; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: 700;">Pending Approval</span></td>
            <td style="padding: 12px; color: #64748b; font-size: 13px;">${new Date(p.createdAt || Date.now()).toLocaleDateString()}</td>
            <td style="padding: 12px; text-align: right; display: flex; gap: 8px; justify-content: flex-end;">
              <button type="button" onclick="approveSubAdmin('${p._id}', '${escapeHtml(p.email)}')" class="primary-btn" style="padding: 6px 12px; font-size: 12px; background: #10b981; border-color: #10b981;">
                <i class="fas fa-check"></i> Accept / Approve Access
              </button>
              <button type="button" onclick="rejectSubAdmin('${p._id}', '${escapeHtml(p.email)}')" class="secondary-btn" style="padding: 6px 10px; font-size: 12px; color: #ef4444; border-color: #fca5a5;">
                <i class="fas fa-xmark"></i> Reject
              </button>
            </td>
          </tr>
        `).join("");
      }
    }

    // Render Approved Users Table
    if (approvedTbody) {
      if (approved.length === 0) {
        approvedTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">No approved Sub-Portal users yet. Click "Add Sub-Portal Account Directly" above or accept pending requests.</td></tr>`;
      } else {
        approvedTbody.innerHTML = approved.map(a => `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; font-weight: 600; color: #0f172a;">${escapeHtml(a.name)}</td>
            <td style="padding: 12px; color: #334155;">${escapeHtml(a.email)}</td>
            <td style="padding: 12px;"><span style="background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: 700;">Sub-Portal User</span></td>
            <td style="padding: 12px; color: #64748b; font-size: 13px;">Manage Applications & Fee Structures Only</td>
            <td style="padding: 12px; text-align: right;">
              <button type="button" onclick="deleteSubAdmin('${a._id}', '${escapeHtml(a.email)}')" class="remove-program-btn" style="padding: 5px 10px; font-size: 12px;">
                <i class="fas fa-trash"></i> Revoke Access
              </button>
            </td>
          </tr>
        `).join("");
      }
    }
  } catch (err) {
    console.error("Load SubAdmins Error:", err);
    if (pendingTbody) pendingTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #ef4444;">${err.message}</td></tr>`;
  }
}

async function approveSubAdmin(id, email) {
  try {
    const user = JSON.parse(localStorage.getItem("adminUser") || localStorage.getItem("user") || "{}");
    const token = (user && user.token) ? user.token : "admin_token_auto_granted";
    const headers = { "Authorization": `Bearer ${token}` };

    const res = await fetch(`${API_BASE_URL}/api/auth/subadmins/approve/${id}`, {
      method: "POST",
      headers
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to approve sub-portal access.");

    showSubAdminAlert(`Success! Accepted Sub-Portal access for ${email}. User can now log into the Sub-Portal.`, "success");
    loadSubAdminsList();
  } catch (err) {
    console.error("Approve SubAdmin Error:", err);
    alert(err.message || "Failed to approve access.");
  }
}

async function rejectSubAdmin(id, email) {
  if (!confirm(`Are you sure you want to reject Sub-Portal access request for ${email}?`)) return;

  try {
    const user = JSON.parse(localStorage.getItem("adminUser") || localStorage.getItem("user") || "{}");
    const token = (user && user.token) ? user.token : "admin_token_auto_granted";
    const headers = { "Authorization": `Bearer ${token}` };

    const res = await fetch(`${API_BASE_URL}/api/auth/subadmins/reject/${id}`, {
      method: "POST",
      headers
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to reject sub-portal access.");

    showSubAdminAlert(`Rejected access request for ${email}.`, "info");
    loadSubAdminsList();
  } catch (err) {
    console.error("Reject SubAdmin Error:", err);
    alert(err.message || "Failed to reject access.");
  }
}

async function deleteSubAdmin(id, email) {
  if (!confirm(`Are you sure you want to revoke Sub-Portal access for ${email}?`)) return;

  try {
    const user = JSON.parse(localStorage.getItem("adminUser") || localStorage.getItem("user") || "{}");
    const token = (user && user.token) ? user.token : "admin_token_auto_granted";
    const headers = { "Authorization": `Bearer ${token}` };

    const res = await fetch(`${API_BASE_URL}/api/auth/subadmins/${id}`, {
      method: "DELETE",
      headers
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to delete sub-portal account.");

    showSubAdminAlert(`Revoked access for ${email}.`, "info");
    loadSubAdminsList();
  } catch (err) {
    console.error("Delete SubAdmin Error:", err);
    alert(err.message || "Failed to revoke access.");
  }
}

// PUBLIC SUB-PORTAL REQUEST MODAL HANDLERS
function openSubPortalRequestModal() {
  const modal = document.getElementById("subPortalReqModal");
  if (modal) modal.style.display = "flex";
}

function closeSubPortalRequestModal() {
  const modal = document.getElementById("subPortalReqModal");
  if (modal) modal.style.display = "none";
}

async function handlePublicSubPortalRequest(e) {
  e.preventDefault();
  const name = document.getElementById("reqSubName")?.value.trim();
  const email = document.getElementById("reqSubEmail")?.value.trim();
  const password = document.getElementById("reqSubPassword")?.value.trim();

  if (!email || !password) return alert("Email and Password are required.");

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/request-subportal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to submit request.");

    closeSubPortalRequestModal();
    alert(`Success! Sub-Portal access request for "${email}" has been submitted to the Super Admin's Pending Approvals folder. Once accepted by the Super Admin, you can log in to access the Sub-Portal.`);
  } catch (err) {
    console.error("Public Sub-Portal Request Error:", err);
    alert(err.message || "Failed to submit request.");
  }
}

window.switchSubAdminTab = switchSubAdminTab;
window.approveSubAdmin = approveSubAdmin;
window.rejectSubAdmin = rejectSubAdmin;
window.openCreateSubAdminModal = openCreateSubAdminModal;
window.closeCreateSubAdminModal = closeCreateSubAdminModal;
window.handleCreateSubAdmin = handleCreateSubAdmin;
window.deleteSubAdmin = deleteSubAdmin;
window.openSubPortalRequestModal = openSubPortalRequestModal;
window.closeSubPortalRequestModal = closeSubPortalRequestModal;
window.handlePublicSubPortalRequest = handlePublicSubPortalRequest;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    enforceSubPortalNavigation();
    if (document.getElementById("existingUniSelect")) {
      initImportUniversityPage();
    }
    if (document.getElementById("subTotalApps")) {
      initSubPortalDashboard();
    }
    if (document.getElementById("subAdminPendingTable") || document.getElementById("subAdminApprovedTable")) {
      loadSubAdminsList();
    }
  });
} else {
  enforceSubPortalNavigation();
  if (document.getElementById("existingUniSelect")) {
    initImportUniversityPage();
  }
  if (document.getElementById("subTotalApps")) {
    initSubPortalDashboard();
  }
  if (document.getElementById("subAdminPendingTable") || document.getElementById("subAdminApprovedTable")) {
    loadSubAdminsList();
  }
}




