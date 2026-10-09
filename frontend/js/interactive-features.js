/**
 * Admission Turkey - High-Level Interactive Features Suite
 * Includes:
 * 1. Smart AI University Matchmaker
 * 2. Interactive Scholarship & Tuition Calculator
 * 3. Step-by-Step Fast Track Application Wizard Modal
 * 4. Floating AI Assistant Chatbot Widget
 */

(function () {
  'use strict';

  // Sample database of top Turkish partner universities
  const TURKISH_UNIVERSITIES_DB = [
    {
      id: 'medipol',
      name: 'Istanbul Medipol University',
      city: 'istanbul',
      logo: 'images/logo.png',
      badge: 'Top Medical University',
      rating: '4.9 ★',
      fields: ['medicine', 'engineering', 'cs', 'business'],
      degrees: ['bachelor', 'master', 'phd'],
      baseTuition: 16000,
      scholarshipTuition: 7500,
      maxScholarship: '50%',
      language: 'English & Turkish',
      acceptanceRate: '94%',
      features: ['JCI Accredited Hospital', 'Modern Labs', 'Istanbul Campus']
    },
    {
      id: 'bau',
      name: 'Bahçeşehir University (BAU)',
      city: 'istanbul',
      logo: 'images/logo.png',
      badge: 'Global Exchange Partner',
      rating: '4.8 ★',
      fields: ['engineering', 'cs', 'business', 'architecture', 'law'],
      degrees: ['bachelor', 'master', 'phd'],
      baseTuition: 9000,
      scholarshipTuition: 4500,
      maxScholarship: '50%',
      language: 'English',
      acceptanceRate: '96%',
      features: ['Bosphorus Campus', 'CO-OP Work Program', 'Global Network']
    },
    {
      id: 'istinye',
      name: 'Istinye University',
      city: 'istanbul',
      logo: 'images/logo.png',
      badge: 'High Tech & AI Focus',
      rating: '4.7 ★',
      fields: ['medicine', 'cs', 'engineering', 'business'],
      degrees: ['bachelor', 'master', 'phd'],
      baseTuition: 12000,
      scholarshipTuition: 4200,
      maxScholarship: '65%',
      language: 'English',
      acceptanceRate: '95%',
      features: ['2 Supercomputer Labs', 'Medical Research Center', 'Modern Housing']
    },
    {
      id: 'bilgi',
      name: 'Istanbul Bilgi University',
      city: 'istanbul',
      logo: 'images/logo.png',
      badge: 'Creativity & Innovation Hub',
      rating: '4.8 ★',
      fields: ['architecture', 'business', 'law', 'cs'],
      degrees: ['bachelor', 'master'],
      baseTuition: 8500,
      scholarshipTuition: 3800,
      maxScholarship: '55%',
      language: 'English',
      acceptanceRate: '93%',
      features: ['Historic Santral Campus', 'International Accreditation']
    },
    {
      id: 'altinbas',
      name: 'Altınbaş University',
      city: 'istanbul',
      logo: 'images/logo.png',
      badge: 'Best Value Tuition',
      rating: '4.6 ★',
      fields: ['medicine', 'engineering', 'business', 'law'],
      degrees: ['bachelor', 'master', 'associate'],
      baseTuition: 6000,
      scholarshipTuition: 2800,
      maxScholarship: '50%',
      language: 'English',
      acceptanceRate: '98%',
      features: ['Affordable Fees', 'Dormitories', 'Easy Placement']
    },
    {
      id: 'uskudar',
      name: 'Üsküdar University',
      city: 'istanbul',
      logo: 'images/logo.png',
      badge: 'Leader in Neuroscience & Bio-Eng',
      rating: '4.7 ★',
      fields: ['medicine', 'cs', 'engineering', 'law'],
      degrees: ['bachelor', 'master', 'phd'],
      baseTuition: 5500,
      scholarshipTuition: 2600,
      maxScholarship: '50%',
      language: 'English & Turkish',
      acceptanceRate: '97%',
      features: ['NP Brain Hospital', 'High Research Grant', 'Vibrant Campus']
    }
  ];

  // Knowledge base for AI Support Chatbot
  const AI_KNOWLEDGE_BASE = [
    {
      keywords: ['scholarship', '50%', 'discount', 'free', 'cost', 'fee', 'price'],
      answer: "🎓 <strong>Guaranteed Scholarships in Turkey:</strong><br>Admission Turkey provides <strong>25% to 75% guaranteed merit scholarships</strong> for international students across premier universities. Tuition fees start as low as <strong>$2,500/year</strong> post-scholarship! Use our Scholarship Calculator on this page to check your exact savings."
    },
    {
      keywords: ['medicine', 'doctor', 'medical', 'dentistry', 'pharmacy'],
      answer: "🏥 <strong>Medical Studies in Türkiye:</strong><br>Top recommended Medical universities include <strong>Istanbul Medipol University</strong>, <strong>Istinye University</strong>, and <strong>Üsküdar University</strong>. English-medium Medicine programs average $12,000 - $20,000/yr before scholarship discounts. No entrance exam required for direct admission via Admission Turkey!"
    },
    {
      keywords: ['visa', 'passport', 'embassy', 'requirement', 'permit'],
      answer: "✈️ <strong>Student Visa & TRC:</strong><br>Once you receive your official Acceptance Letter, we assist you in booking your Turkish consulate appointment. You'll need: Passport, Official Acceptance Letter, High School Diploma, and Proof of Funds. Upon arrival in Turkey, our team handles your Student Residence Permit (Ikamet) free of charge."
    },
    {
      keywords: ['living', 'expense', 'dorm', 'housing', 'apartment', 'rent'],
      answer: "💰 <strong>Living Costs in Turkey:</strong><br>Turkey is exceptionally affordable for international students!<br>• Dormitory / Shared Apt: <strong>$150 - $250 / month</strong><br>• Food & Utilities: <strong>$150 - $200 / month</strong><br>• Total living budget: <strong>~$300 - $450 / month</strong>"
    },
    {
      keywords: ['apply', 'process', 'document', 'step', 'how to'],
      answer: "📄 <strong>Simple 4-Step Application:</strong><br>1️⃣ Click 'Apply Now' to open our Fast Track Wizard.<br>2️⃣ Select your degree & major.<br>3️⃣ Enter your GPA and passport details.<br>4️⃣ Receive your unconditional offer letter within <strong>48 hours</strong>!"
    }
  ];

  document.addEventListener('DOMContentLoaded', () => {
    initAiMatchmaker();
    initScholarshipCalculator();
    initApplicationWizard();
    initAiChatbot();
    initWizardTriggerButtons();
  });

  /* =========================================================
     1. AI UNIVERSITY MATCHMAKER LOGIC
     ========================================================= */
  function initAiMatchmaker() {
    const matchForm = document.getElementById('aiMatchmakerForm');
    const matchResults = document.getElementById('aiMatchResults');
    const matchCardsGrid = document.getElementById('matchCardsGrid');
    const matchCountBadge = document.getElementById('matchCountBadge');

    if (!matchForm || !matchResults || !matchCardsGrid) return;

    matchForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const degree = document.getElementById('matchDegree').value;
      const field = document.getElementById('matchField').value;
      const maxBudget = parseFloat(document.getElementById('matchBudget').value) || 10000;
      const city = document.getElementById('matchCity').value;

      // Filter matches
      const matches = TURKISH_UNIVERSITIES_DB.filter(uni => {
        const matchesDegree = uni.degrees.includes(degree);
        const matchesField = uni.fields.includes(field);
        const matchesBudget = uni.scholarshipTuition <= maxBudget;
        const matchesCity = city === 'any' || uni.city === city;
        return matchesDegree && matchesField && matchesBudget && matchesCity;
      });

      // If no exact match, fallback to top budget matches
      const finalResults = matches.length > 0
        ? matches
        : TURKISH_UNIVERSITIES_DB.filter(u => u.scholarshipTuition <= maxBudget).slice(0, 3);

      renderMatchResults(finalResults, matchResults, matchCardsGrid, matchCountBadge);
    });
  }

  function renderMatchResults(unis, resultsContainer, grid, countBadge) {
    resultsContainer.style.display = 'block';
    grid.innerHTML = '';
    countBadge.textContent = `${unis.length} Top Matches Found`;

    unis.forEach((uni, idx) => {
      const matchScore = 95 - (idx * 3);
      const card = document.createElement('div');
      card.className = 'match-uni-card card-tilt reveal-scale';
      card.innerHTML = `
        <div class="match-score-badge"><i class="fas fa-bolt"></i> ${matchScore}% AI Match</div>
        <div class="match-uni-header">
          <div class="match-uni-logo"><i class="fas fa-university"></i></div>
          <div>
            <h4>${uni.name}</h4>
            <span class="match-uni-meta"><i class="fas fa-map-marker-alt"></i> ${capitalize(uni.city)}, Turkey</span>
          </div>
        </div>
        <div class="match-tags">
          <span class="match-tag gold"><i class="fas fa-certificate"></i> ${uni.badge}</span>
          <span class="match-tag green"><i class="fas fa-percentage"></i> ${uni.maxScholarship} Scholarship</span>
        </div>
        <div class="match-tuition-box">
          <div class="price-row">
            <span class="old-price">$${uni.baseTuition.toLocaleString()}/yr</span>
            <span class="new-price">$${uni.scholarshipTuition.toLocaleString()}<small>/yr net</small></span>
          </div>
          <small class="acceptance-rate"><i class="fas fa-user-check"></i> ${uni.acceptanceRate} Placement Rate</small>
        </div>
        <div class="match-card-actions">
          <button type="button" class="primary-btn match-apply-btn open-wizard-btn" data-uni="${uni.name}">
            <i class="fas fa-paper-plane"></i> Apply with ${matchScore}% Match
          </button>
          <a href="universities.html?search=${encodeURIComponent(uni.name)}" class="secondary-btn match-details-link-btn" target="_blank" title="View ${uni.name} details">
            <i class="fas fa-university"></i> View Page
          </a>
        </div>
      `;
      grid.appendChild(card);
    });

    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* =========================================================
     2. SCHOLARSHIP & TUITION CALCULATOR LOGIC
     ========================================================= */
  function initScholarshipCalculator() {
    const gpaSlider = document.getElementById('gpaRange');
    const gpaDisplay = document.getElementById('gpaValDisplay');
    const calcField = document.getElementById('calcField');
    const calcHousing = document.getElementById('calcHousing');
    const calcCityTier = document.getElementById('calcCityTier');

    if (!gpaSlider || !gpaDisplay) return;

    const baseTuitions = {
      medicine: 18000,
      engineering: 6500,
      business: 5000,
      arts: 4000
    };

    const housingCosts = {
      dorm_shared: 1800,
      dorm_single: 3200,
      apt_shared: 2500,
      apt_private: 4500
    };

    function updateCalculator() {
      const gpa = parseInt(gpaSlider.value, 10);
      let gpaGpaScale = (gpa / 25).toFixed(1);
      gpaDisplay.textContent = `${gpa}% (${gpaGpaScale} / 4.0)`;

      // Calculate Scholarship Rate based on GPA
      let discountRate = 0.25;
      let scholarshipBadge = '25% Entry Scholarship';

      if (gpa >= 95) {
        discountRate = 0.75;
        scholarshipBadge = '75% Presidential Merit Scholarship';
      } else if (gpa >= 85) {
        discountRate = 0.50;
        scholarshipBadge = '50% High Achievement Scholarship';
      } else if (gpa >= 70) {
        discountRate = 0.35;
        scholarshipBadge = '35% Academic Excellence Discount';
      }

      const selectedField = calcField ? calcField.value : 'engineering';
      const baseTuition = baseTuitions[selectedField] || 6500;
      const savings = Math.round(baseTuition * discountRate);
      const netTuition = baseTuition - savings;

      const housingKey = calcHousing ? calcHousing.value : 'dorm_shared';
      let livingCost = housingCosts[housingKey] || 2500;

      if (calcCityTier && calcCityTier.value === 'tier2') {
        livingCost = Math.round(livingCost * 0.85); // 15% cheaper living cost in Tier 2 cities
      }

      const totalYearly = netTuition + livingCost;

      // Update UI elements smoothly
      document.getElementById('scholarshipRateText').textContent = scholarshipBadge;
      document.getElementById('baseTuitionText').textContent = `$${baseTuition.toLocaleString()} / yr`;
      document.getElementById('savingsText').textContent = `-$${savings.toLocaleString()} / yr`;
      document.getElementById('netTuitionText').textContent = `$${netTuition.toLocaleString()} / yr`;
      document.getElementById('livingCostText').textContent = `$${livingCost.toLocaleString()} / yr`;
      document.getElementById('totalCostText').textContent = `$${totalYearly.toLocaleString()} / yr`;
    }

    gpaSlider.addEventListener('input', updateCalculator);
    if (calcField) calcField.addEventListener('change', updateCalculator);
    if (calcHousing) calcHousing.addEventListener('change', updateCalculator);
    if (calcCityTier) calcCityTier.addEventListener('change', updateCalculator);

    updateCalculator();
  }

  /* =========================================================
     3. FAST TRACK APPLICATION WIZARD MODAL LOGIC
     ========================================================= */
  function initApplicationWizard() {
    const wizardModal = document.getElementById('applicationWizardModal');
    const closeWizardBtn = document.getElementById('closeWizardBtn');
    const wizardForm = document.getElementById('wizardForm');
    const wizDoneBtn = document.getElementById('wizDoneBtn');

    if (!wizardModal || !wizardForm) return;

    let currentStep = 1;

    // Step switching helper
    function gotoStep(stepNum) {
      currentStep = stepNum;

      // Panels
      document.querySelectorAll('.wizard-step-panel').forEach(p => p.style.display = 'none');
      const targetPanel = document.getElementById(`wizStep${stepNum}`);
      if (targetPanel) targetPanel.style.display = 'block';

      // Step indicators
      document.querySelectorAll('.wizard-step-item').forEach(item => {
        const s = parseInt(item.dataset.step, 10);
        if (s <= stepNum) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      // Step 4 Scorecard computation
      if (stepNum === 4) {
        computeScorecardAndSummary();
      }
    }

    // Next step triggers
    document.querySelectorAll('.wiz-next-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const nextStep = parseInt(e.currentTarget.dataset.next, 10);
        // Validate inputs in current step
        const currentPanel = document.getElementById(`wizStep${currentStep}`);
        const inputs = currentPanel.querySelectorAll('input[required], select[required]');
        let valid = true;
        inputs.forEach(input => {
          if (!input.value.trim()) {
            valid = false;
            input.classList.add('input-error');
          } else {
            input.classList.remove('input-error');
          }
        });

        if (!valid) {
          alert('Please complete all required fields before proceeding.');
          return;
        }

        gotoStep(nextStep);
      });
    });

    // Prev step triggers
    document.querySelectorAll('.wiz-prev-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prevStep = parseInt(e.currentTarget.dataset.prev, 10);
        gotoStep(prevStep);
      });
    });

    // Scorecard computation
    function computeScorecardAndSummary() {
      const name = document.getElementById('wizFullName').value || 'Student Candidate';
      const major = document.getElementById('wizMajor').value || 'Selected Program';
      const degree = document.getElementById('wizDegree').value || 'bachelor';
      const uni = document.getElementById('wizUni').value || 'Top Turkish Partner University';
      const email = document.getElementById('wizEmail').value || '-';
      const phone = document.getElementById('wizPhone').value || '-';
      const gpa = parseInt(document.getElementById('wizGpa').value || 85, 10);

      // Score rating calculation
      let scoreNum = Math.min(99, Math.max(75, gpa + 10));
      document.getElementById('wizScoreNum').textContent = `${scoreNum}%`;

      let scoreTitle = 'High Eligibility Candidate';
      let scoreDesc = `Great news, ${name}! Your academic score of ${gpa}% qualifies you for up to <strong>50% - 75% Guaranteed Merit Scholarship</strong> across Türkiye's top universities.`;

      if (gpa >= 90) {
        scoreTitle = '🌟 Premier Honors Candidate';
        scoreDesc = `Outstanding! Your GPA of ${gpa}% qualifies you for <strong>up to 75% Presidential Scholarship</strong> & priority visa processing!`;
      }

      document.getElementById('wizScoreTitle').innerHTML = scoreTitle;
      document.getElementById('wizScoreDesc').innerHTML = scoreDesc;

      document.getElementById('sumName').textContent = name;
      document.getElementById('sumMajor').textContent = major;
      document.getElementById('sumDegree').textContent = capitalize(degree);
      document.getElementById('sumUni').textContent = uni;
      document.getElementById('sumEmail').textContent = email;
      document.getElementById('sumPhone').textContent = phone;
    }

    // Submit handler
    wizardForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('wizSubmitBtn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting Application...';

      const refCode = 'TR-2026-' + Math.random().toString(36).substring(2, 7).toUpperCase();

      const applicationData = {
        refCode,
        fullName: document.getElementById('wizFullName').value,
        email: document.getElementById('wizEmail').value,
        phone: document.getElementById('wizPhone').value,
        country: document.getElementById('wizCountry').value,
        degree: document.getElementById('wizDegree').value,
        major: document.getElementById('wizMajor').value,
        preferredUni: document.getElementById('wizUni').value,
        gpa: document.getElementById('wizGpa').value,
        gradYear: document.getElementById('wizGradYear').value,
        status: 'Submitted',
        createdAt: new Date().toISOString()
      };

      // Save to local storage for instant tracker sync
      try {
        const existing = JSON.parse(localStorage.getItem('my_applications') || '[]');
        existing.unshift(applicationData);
        localStorage.setItem('my_applications', JSON.stringify(existing));
      } catch (err) {
        console.error('Local storage error:', err);
      }

      // Try sending to backend API if running
      try {
        if (typeof API_BASE_URL !== 'undefined') {
          await fetch(`${API_BASE_URL}/api/applications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(applicationData)
          });
        }
      } catch (backendErr) {
        console.log('Backend sync offline, stored locally.', backendErr);
      }

      setTimeout(() => {
        wizardForm.style.display = 'none';
        document.querySelector('.wizard-progress-bar').style.display = 'none';
        const successState = document.getElementById('wizSuccessState');
        if (successState) {
          document.getElementById('wizRefCodeBadge').textContent = refCode;
          successState.style.display = 'block';
        }
      }, 1000);
    });

    if (closeWizardBtn) {
      closeWizardBtn.addEventListener('click', () => {
        wizardModal.style.display = 'none';
      });
    }

    if (wizDoneBtn) {
      wizDoneBtn.addEventListener('click', () => {
        wizardModal.style.display = 'none';
        window.location.reload();
      });
    }
  }

  /* Helper to open wizard from anywhere */
  function initWizardTriggerButtons() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('.open-wizard-btn');
      if (trigger) {
        e.preventDefault();
        const wizardModal = document.getElementById('applicationWizardModal');
        if (wizardModal) {
          const prefUni = trigger.dataset.uni;
          if (prefUni) {
            const wizUniSelect = document.getElementById('wizUni');
            if (wizUniSelect) {
              let matchedOption = Array.from(wizUniSelect.options).find(opt => opt.value.toLowerCase().includes(prefUni.toLowerCase()) || opt.text.toLowerCase().includes(prefUni.toLowerCase()));
              if (matchedOption) {
                wizUniSelect.value = matchedOption.value;
              } else {
                wizUniSelect.value = prefUni;
              }
            }
          }
          wizardModal.style.display = 'flex';
          wizardModal.style.opacity = '1';
          wizardModal.style.visibility = 'visible';
          const modalBody = wizardModal.querySelector('.wizard-modal-card');
          if (modalBody) modalBody.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          const uniParam = trigger.dataset.uni ? '?uni=' + encodeURIComponent(trigger.dataset.uni) : '';
          window.location.href = 'application.html' + uniParam;
        }
      }
    });
  }

  /* =========================================================
     4. FLOATING AI ASSISTANT CHATBOT LOGIC
     ========================================================= */
  function initAiChatbot() {
    const chatToggleBtn = document.getElementById('aiChatToggleBtn');
    const chatWindow = document.getElementById('aiChatWindow');
    const closeAiChatBtn = document.getElementById('closeAiChatBtn');
    const chatForm = document.getElementById('aiChatForm');
    const chatInput = document.getElementById('aiChatInput');
    const chatMessages = document.getElementById('aiChatMessages');
    const quickPills = document.getElementById('chatQuickPills');

    if (!chatToggleBtn || !chatWindow) return;

    chatToggleBtn.addEventListener('click', () => {
      const isVisible = chatWindow.style.display === 'flex';
      chatWindow.style.display = isVisible ? 'none' : 'flex';
      const openIcon = chatToggleBtn.querySelector('.open-icon');
      const closeIcon = chatToggleBtn.querySelector('.close-icon');

      if (openIcon && closeIcon) {
        openIcon.style.display = isVisible ? 'inline-block' : 'none';
        closeIcon.style.display = isVisible ? 'none' : 'inline-block';
      }
    });

    if (closeAiChatBtn) {
      closeAiChatBtn.addEventListener('click', () => {
        chatWindow.style.display = 'none';
        const openIcon = chatToggleBtn.querySelector('.open-icon');
        const closeIcon = chatToggleBtn.querySelector('.close-icon');
        if (openIcon && closeIcon) {
          openIcon.style.display = 'inline-block';
          closeIcon.style.display = 'none';
        }
      });
    }

    if (quickPills) {
      quickPills.addEventListener('click', (e) => {
        const pill = e.target.closest('.chat-pill');
        if (pill) {
          const text = pill.textContent.trim();
          sendUserMessage(text);
        }
      });
    }

    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (text) {
          sendUserMessage(text);
          chatInput.value = '';
        }
      });
    }

    function sendUserMessage(text) {
      // Append user bubble
      appendMessage(text, 'user');

      // Typing indicator
      const typingElem = appendTypingIndicator();

      // Find answer
      setTimeout(() => {
        typingElem.remove();
        const responseText = findAiAnswer(text);
        appendMessage(responseText, 'bot');
      }, 700);
    }

    function findAiAnswer(query) {
      const qLower = query.toLowerCase();
      for (const item of AI_KNOWLEDGE_BASE) {
        if (item.keywords.some(k => qLower.includes(k))) {
          return item.answer;
        }
      }
      return "✨ I would love to help with that! Admission Turkey works directly with 50+ accredited universities offering up to 75% guaranteed scholarships. Would you like me to open the <strong>Fast Track Application Wizard</strong> or connect you directly with a <strong>Human Admission Counselor</strong> on WhatsApp?";
    }

    function appendMessage(content, sender) {
      const msgDiv = document.createElement('div');
      msgDiv.className = `chat-msg ${sender}-msg`;
      msgDiv.innerHTML = `<div class="msg-bubble">${content}</div>`;
      chatMessages.appendChild(msgDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function appendTypingIndicator() {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'chat-msg bot-msg typing-dots';
      typingDiv.innerHTML = `
        <div class="msg-bubble">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
      `;
      chatMessages.appendChild(typingDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return typingDiv;
    }
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

})();
