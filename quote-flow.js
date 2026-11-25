const BOOKING_URL = "";
const BOOKING_PREFILL = false;

/* Workshop payment URLs
   Leave PAYMENT_URL empty ("") to keep the original behaviour (3-step enquiry form submitting to Web3Forms).
   When PAYMENT_URL starts with https://, clicking "Continue to payment" on the workshop fee box navigates
   to this URL with the workshop name in the query parameter named below.
   PAYMENT_URL_INTL is a map from workshop slug (e.g. "rna-seq-reference", "atac-seq", or "default")
   to the PayGlocal payment link for attendees outside India. If empty, all visitors use PAYMENT_URL. */
const PAYMENT_URL = "https://pages.razorpay.com/pl_U4QgQ6vQVhkEs3/view";
const PAYMENT_WORKSHOP_PARAM = "workshop_name";
const PAYMENT_URL_INTL = {};
const PAYMENT_INTL_WORKSHOP_PARAM = "";
const PAYMENT_INTL_FEE_TEXT = "";

(function () {
    'use strict';

    const COUNTRIES = [
        { code: "AF", name: "Afghanistan" },
        { code: "AL", name: "Albania" },
        { code: "DZ", name: "Algeria" },
        { code: "AD", name: "Andorra" },
        { code: "AO", name: "Angola" },
        { code: "AG", name: "Antigua and Barbuda" },
        { code: "AR", name: "Argentina" },
        { code: "AM", name: "Armenia" },
        { code: "AU", name: "Australia" },
        { code: "AT", name: "Austria" },
        { code: "AZ", name: "Azerbaijan" },
        { code: "BS", name: "Bahamas" },
        { code: "BH", name: "Bahrain" },
        { code: "BD", name: "Bangladesh" },
        { code: "BB", name: "Barbados" },
        { code: "BY", name: "Belarus" },
        { code: "BE", name: "Belgium" },
        { code: "BZ", name: "Belize" },
        { code: "BJ", name: "Benin" },
        { code: "BT", name: "Bhutan" },
        { code: "BO", name: "Bolivia" },
        { code: "BA", name: "Bosnia and Herzegovina" },
        { code: "BW", name: "Botswana" },
        { code: "BR", name: "Brazil" },
        { code: "BN", name: "Brunei" },
        { code: "BG", name: "Bulgaria" },
        { code: "BF", name: "Burkina Faso" },
        { code: "BI", name: "Burundi" },
        { code: "CV", name: "Cabo Verde" },
        { code: "KH", name: "Cambodia" },
        { code: "CM", name: "Cameroon" },
        { code: "CA", name: "Canada" },
        { code: "CF", name: "Central African Republic" },
        { code: "TD", name: "Chad" },
        { code: "CL", name: "Chile" },
        { code: "CN", name: "China" },
        { code: "CO", name: "Colombia" },
        { code: "KM", name: "Comoros" },
        { code: "CG", name: "Congo" },
        { code: "CR", name: "Costa Rica" },
        { code: "HR", name: "Croatia" },
        { code: "CU", name: "Cuba" },
        { code: "CY", name: "Cyprus" },
        { code: "CZ", name: "Czech Republic" },
        { code: "CD", name: "Democratic Republic of the Congo" },
        { code: "DK", name: "Denmark" },
        { code: "DJ", name: "Djibouti" },
        { code: "DM", name: "Dominica" },
        { code: "DO", name: "Dominican Republic" },
        { code: "EC", name: "Ecuador" },
        { code: "EG", name: "Egypt" },
        { code: "SV", name: "El Salvador" },
        { code: "GQ", name: "Equatorial Guinea" },
        { code: "ER", name: "Eritrea" },
        { code: "EE", name: "Estonia" },
        { code: "SZ", name: "Eswatini" },
        { code: "ET", name: "Ethiopia" },
        { code: "FJ", name: "Fiji" },
        { code: "FI", name: "Finland" },
        { code: "FR", name: "France" },
        { code: "GA", name: "Gabon" },
        { code: "GM", name: "Gambia" },
        { code: "GE", name: "Georgia" },
        { code: "DE", name: "Germany" },
        { code: "GH", name: "Ghana" },
        { code: "GR", name: "Greece" },
        { code: "GD", name: "Grenada" },
        { code: "GT", name: "Guatemala" },
        { code: "GN", name: "Guinea" },
        { code: "GW", name: "Guinea-Bissau" },
        { code: "GY", name: "Guyana" },
        { code: "HT", name: "Haiti" },
        { code: "HN", name: "Honduras" },
        { code: "HU", name: "Hungary" },
        { code: "IS", name: "Iceland" },
        { code: "ID", name: "Indonesia" },
        { code: "IR", name: "Iran" },
        { code: "IQ", name: "Iraq" },
        { code: "IE", name: "Ireland" },
        { code: "IL", name: "Israel" },
        { code: "IT", name: "Italy" },
        { code: "CI", name: "Ivory Coast" },
        { code: "JM", name: "Jamaica" },
        { code: "JP", name: "Japan" },
        { code: "JO", name: "Jordan" },
        { code: "KZ", name: "Kazakhstan" },
        { code: "KE", name: "Kenya" },
        { code: "KI", name: "Kiribati" },
        { code: "KW", name: "Kuwait" },
        { code: "KG", name: "Kyrgyzstan" },
        { code: "LA", name: "Laos" },
        { code: "LV", name: "Latvia" },
        { code: "LB", name: "Lebanon" },
        { code: "LS", name: "Lesotho" },
        { code: "LR", name: "Liberia" },
        { code: "LY", name: "Libya" },
        { code: "LI", name: "Liechtenstein" },
        { code: "LT", name: "Lithuania" },
        { code: "LU", name: "Luxembourg" },
        { code: "MG", name: "Madagascar" },
        { code: "MW", name: "Malawi" },
        { code: "MY", name: "Malaysia" },
        { code: "MV", name: "Maldives" },
        { code: "ML", name: "Mali" },
        { code: "MT", name: "Malta" },
        { code: "MH", name: "Marshall Islands" },
        { code: "MR", name: "Mauritania" },
        { code: "MU", name: "Mauritius" },
        { code: "MX", name: "Mexico" },
        { code: "FM", name: "Micronesia" },
        { code: "MD", name: "Moldova" },
        { code: "MC", name: "Monaco" },
        { code: "MN", name: "Mongolia" },
        { code: "ME", name: "Montenegro" },
        { code: "MA", name: "Morocco" },
        { code: "MZ", name: "Mozambique" },
        { code: "MM", name: "Myanmar" },
        { code: "NA", name: "Namibia" },
        { code: "NR", name: "Nauru" },
        { code: "NP", name: "Nepal" },
        { code: "NL", name: "Netherlands" },
        { code: "NZ", name: "New Zealand" },
        { code: "NI", name: "Nicaragua" },
        { code: "NE", name: "Niger" },
        { code: "NG", name: "Nigeria" },
        { code: "KP", name: "North Korea" },
        { code: "MK", name: "North Macedonia" },
        { code: "NO", name: "Norway" },
        { code: "OM", name: "Oman" },
        { code: "PK", name: "Pakistan" },
        { code: "PW", name: "Palau" },
        { code: "PS", name: "Palestine" },
        { code: "PA", name: "Panama" },
        { code: "PG", name: "Papua New Guinea" },
        { code: "PY", name: "Paraguay" },
        { code: "PE", name: "Peru" },
        { code: "PH", name: "Philippines" },
        { code: "PL", name: "Poland" },
        { code: "PT", name: "Portugal" },
        { code: "QA", name: "Qatar" },
        { code: "RO", name: "Romania" },
        { code: "RU", name: "Russia" },
        { code: "RW", name: "Rwanda" },
        { code: "KN", name: "Saint Kitts and Nevis" },
        { code: "LC", name: "Saint Lucia" },
        { code: "VC", name: "Saint Vincent and the Grenadines" },
        { code: "WS", name: "Samoa" },
        { code: "SM", name: "San Marino" },
        { code: "ST", name: "Sao Tome and Principe" },
        { code: "SA", name: "Saudi Arabia" },
        { code: "SN", name: "Senegal" },
        { code: "RS", name: "Serbia" },
        { code: "SC", name: "Seychelles" },
        { code: "SL", name: "Sierra Leone" },
        { code: "SG", name: "Singapore" },
        { code: "SK", name: "Slovakia" },
        { code: "SI", name: "Slovenia" },
        { code: "SB", name: "Solomon Islands" },
        { code: "SO", name: "Somalia" },
        { code: "ZA", name: "South Africa" },
        { code: "KR", name: "South Korea" },
        { code: "SS", name: "South Sudan" },
        { code: "ES", name: "Spain" },
        { code: "LK", name: "Sri Lanka" },
        { code: "SD", name: "Sudan" },
        { code: "SR", name: "Suriname" },
        { code: "SE", name: "Sweden" },
        { code: "CH", name: "Switzerland" },
        { code: "SY", name: "Syria" },
        { code: "TW", name: "Taiwan" },
        { code: "TJ", name: "Tajikistan" },
        { code: "TZ", name: "Tanzania" },
        { code: "TH", name: "Thailand" },
        { code: "TL", name: "Timor-Leste" },
        { code: "TG", name: "Togo" },
        { code: "TO", name: "Tonga" },
        { code: "TT", name: "Trinidad and Tobago" },
        { code: "TN", name: "Tunisia" },
        { code: "TR", name: "Turkey" },
        { code: "TM", name: "Turkmenistan" },
        { code: "TV", name: "Tuvalu" },
        { code: "UG", name: "Uganda" },
        { code: "UA", name: "Ukraine" },
        { code: "AE", name: "United Arab Emirates" },
        { code: "GB", name: "United Kingdom" },
        { code: "US", name: "United States" },
        { code: "UY", name: "Uruguay" },
        { code: "UZ", name: "Uzbekistan" },
        { code: "VU", name: "Vanuatu" },
        { code: "VA", name: "Vatican City" },
        { code: "VE", name: "Venezuela" },
        { code: "VN", name: "Vietnam" },
        { code: "YE", name: "Yemen" },
        { code: "ZM", name: "Zambia" },
        { code: "ZW", name: "Zimbabwe" }
    ];

    const WORKSHOP_SLUGS = {
        'Workshop: RNA-Seq (reference-based)': 'rna-seq-reference',
        'Workshop: RNA-Seq (de novo)': 'rna-seq-de-novo',
        'Workshop: Single-cell RNA-Seq': 'single-cell-rna-seq',
        'Workshop: lncRNA-Seq': 'lncrna-seq',
        'Workshop: miRNA-Seq': 'mirna-seq',
        'Workshop: PSI-Seq (alternative splicing)': 'psi-seq',
        'Workshop: Spatial Transcriptomics': 'spatial-transcriptomics',
        'Workshop: ChIP-Seq': 'chip-seq',
        'Workshop: SNAP-ChIP (spike-in calibrated)': 'snap-chip',
        'Workshop: ATAC-Seq': 'atac-seq',
        'Workshop: Single-cell ATAC-Seq': 'single-cell-atac-seq',
        'Workshop: Methyl-Seq (DNA methylation)': 'methyl-seq',
        'Workshop: DNA-Seq (variant analysis)': 'dna-seq',
        'Workshop: RAD-Seq': 'rad-seq',
        'Workshop: Whole-Genome de novo Assembly': 'genome-assembly',
        'Workshop: Targeted Metagenomics (16S / ITS)': 'targeted-metagenomics',
        'Workshop: Whole-Genome (Shotgun) Metagenomics': 'shotgun-metagenomics',
        'Workshop: Microarray Data Analysis': 'microarray'
    };

    function getWorkshopSlug(workshopText) {
        if (!workshopText) return '';
        if (WORKSHOP_SLUGS[workshopText]) return WORKSHOP_SLUGS[workshopText];
        for (const [k, v] of Object.entries(WORKSHOP_SLUGS)) {
            if (workshopText.includes(v) || k.toLowerCase() === workshopText.toLowerCase()) return v;
        }
        return workshopText.toLowerCase().replace(/^workshop:\s*/i, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    function getWorkshopLabel(workshopValOrSlug) {
        if (!workshopValOrSlug) return '';
        const found = workshopOptions.find(o => o.value === workshopValOrSlug || o.text === workshopValOrSlug);
        if (found && found.text) return found.text;

        const slugLower = workshopValOrSlug.toLowerCase().trim();
        for (const [label, slug] of Object.entries(WORKSHOP_SLUGS)) {
            if (slug.toLowerCase() === slugLower || label.toLowerCase() === slugLower) {
                return label;
            }
        }
        for (const [label, slug] of Object.entries(WORKSHOP_SLUGS)) {
            if (slug.includes(slugLower) || slugLower.includes(slug)) {
                return label;
            }
        }
        return workshopValOrSlug;
    }

    function isPaymentActive() {
        return Boolean(PAYMENT_URL && PAYMENT_URL.startsWith('https://'));
    }

    function getWorkshopIntlUrl(workshopText) {
        if (!PAYMENT_URL_INTL || typeof PAYMENT_URL_INTL !== 'object') return '';
        const slug = getWorkshopSlug(workshopText);
        let intlUrl = (slug && PAYMENT_URL_INTL[slug]) ? PAYMENT_URL_INTL[slug] : (PAYMENT_URL_INTL['default'] || '');
        if (typeof intlUrl === 'string' && intlUrl.startsWith('https://')) {
            return intlUrl;
        }
        return '';
    }

    function isWorkshopPaymentPath() {
        if (state.need !== 'workshop') return false;
        if (!isPaymentActive()) return false;
        if (state.country === 'IN') return true;
        if (state.country && state.country !== 'IN') {
            return Boolean(getWorkshopIntlUrl(state.workshop));
        }
        if (!state.country) {
            if (isIndianTimeZone) return true;
            if (getWorkshopIntlUrl(state.workshop)) return true;
            return false;
        }
        return false;
    }

    function getCountryName(code) {
        if (!code) return '';
        if (code === 'IN') return 'India';
        const found = COUNTRIES.find(c => c.code === code);
        return found ? found.name : code;
    }

    const NEED_CONFIG = {
        'workshop': {
            name: 'Workshop',
            sub: '30-day online workshop'
        },
        'training': {
            name: 'Internship/Training',
            sub: 'Mentored, hands-on training in bioinformatics'
        },
        'research-training': {
            name: 'Research Training',
            sub: '6 months, mentored, a research paper we submit to a journal'
        },
        'data-analysis': {
            name: 'Data analysis',
            sub: 'We analyse your sequencing or array data'
        },
        'other': {
            name: 'Other',
            sub: 'Collaboration, career guidance or a different question'
        }
    };

    let state = {
        need: '',
        step: 1,
        // Step 2 values
        workshop: '',
        country: '',
        feeAgree: false,
        // Step 3 values
        name: '',
        email: '',
        phone: '',
        org: '',
        level: '',
        programming: '',
        hours: '',
        dataType: '',
        samples: '',
        organism: '',
        budget: '',
        question: '',
        learnGoal: '',
        researchArea: '',
        anythingElse: '',
        otherTopic: '',
        otherHelp: '',
        prefDate: '',
        altDate: '',
        prefTime: '',
        consent: false
    };

    let workshopOptions = [];
    let detectedTimeZone = 'UTC';
    let isIndianTimeZone = false;
    try {
        detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Calcutta';
    } catch (e) {
        detectedTimeZone = 'Asia/Calcutta';
    }
    isIndianTimeZone = (detectedTimeZone === 'Asia/Calcutta' || detectedTimeZone === 'Asia/Kolkata');

    function getTotalSteps() {
        if (state.need === 'workshop') {
            if (!isPaymentActive()) return 3;
            return isWorkshopPaymentPath() ? 2 : 3;
        }
        if (state.need === 'data-analysis' || state.need === 'other') {
            return 2;
        }
        return 3;
    }

    function getTodayString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function initLegacyOptions(form) {
        const serviceSelect = form.querySelector('#service');
        if (serviceSelect) {
            const opts = Array.from(serviceSelect.options);
            workshopOptions = opts
                .filter(o => o.text.startsWith('Workshop:'))
                .map(o => ({ value: o.value, text: o.text }));
        }
    }

    function checkPrefill(form) {
        const params = new URLSearchParams(window.location.search);
        const workshopSlug = params.get('workshop');
        const interestParam = params.get('interest');
        const serviceParam = params.get('service');

        const legacyService = form.querySelector('#service');
        const currentServiceVal = legacyService ? legacyService.value : '';

        if (workshopSlug) {
            state.need = 'workshop';
            state.step = 2;
            const label = getWorkshopLabel(workshopSlug);
            const matched = workshopOptions.find(o => o.value === label || o.text === label);
            if (matched) {
                state.workshop = matched.value;
            } else if (label) {
                state.workshop = label;
            }
            return true;
        }

        if (interestParam) {
            const intLower = interestParam.toLowerCase().trim();
            if (intLower === 'internship') {
                state.need = 'research-training';
                state.step = 2;
                return true;
            } else if (intLower === 'customised-internship') {
                state.need = 'training';
                state.step = 2;
                return true;
            }
        }

        if (serviceParam || currentServiceVal) {
            const val = (serviceParam || currentServiceVal).toLowerCase();
            if (val.startsWith('workshop:')) {
                state.need = 'workshop';
                state.step = 2;
                state.workshop = currentServiceVal;
                return true;
            } else if (val === 'internship') {
                state.need = 'research-training';
                state.step = 2;
                return true;
            } else if (val === 'customised internship' || val === 'customised-internship') {
                state.need = 'training';
                state.step = 2;
                return true;
            } else if (['wgs', 'wes', 'rna', 'meta', 'epi', 'pipeline', 'consulting'].includes(val)) {
                state.need = 'data-analysis';
                state.step = 2; // Step 2 of 2
                if (val === 'wgs') state.dataType = 'WGS';
                else if (val === 'wes') state.dataType = 'WES';
                else if (val === 'rna') state.dataType = 'Bulk RNA-seq';
                else if (val === 'meta') state.dataType = 'Metagenomics';
                else if (val === 'epi') state.dataType = 'ATAC-seq / ChIP-seq';
                return true;
            } else if (['career', 'college', 'other'].includes(val)) {
                state.need = 'other';
                state.step = 2; // Step 2 of 2
                if (val === 'college') state.otherTopic = 'Collaboration';
                else if (val === 'career') state.otherTopic = 'Career guidance';
                else state.otherTopic = 'Something else';
                return true;
            }
        }
        return false;
    }

    function renderStepsIndicator(currentStep, totalSteps) {
        let circlesHtml = '';
        for (let i = 1; i <= totalSteps; i++) {
            const onClass = i <= currentStep ? ' class="on"' : '';
            circlesHtml += `<b${onClass}>${i}</b>`;
            if (i < totalSteps) {
                circlesHtml += `<i></i>`;
            }
        }
        return `
            <div class="qf-steps" aria-hidden="true">
                ${circlesHtml}
                <span>STEP ${currentStep} OF ${totalSteps}</span>
            </div>
        `;
    }

    function render(container) {
        const totalSteps = getTotalSteps();
        const currentStep = state.step;

        let content = '';

        if (currentStep === 1) {
            content = renderStep1();
        } else if (currentStep === 2 && (state.need === 'workshop' || state.need === 'training' || state.need === 'research-training')) {
            content = renderStep2();
        } else {
            // Step 3 for 3-step flows, or Step 2 for 2-step flows (data-analysis / other)
            content = renderStep3(currentStep, totalSteps);
        }

        container.innerHTML = `
            ${renderStepsIndicator(currentStep, totalSteps)}
            <div class="qf-step" aria-live="polite">
                ${content}
            </div>
        `;

        // Focus step heading
        const heading = container.querySelector('.qf-h');
        if (heading) {
            heading.focus();
        }

        bindEvents(container);
    }

    function renderStep1() {
        return `
            <h2 class="qf-h" tabindex="-1">What do you need?</h2>
            <p class="qf-sub">Choose one. All our programmes and services are fee-based.</p>
            <fieldset class="qf-opts">
                <legend class="sr-only" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;">What do you need?</legend>

                <label class="qf-opt ${state.need === 'workshop' ? 'is-sel' : ''}">
                    <input type="radio" name="qf-need" value="workshop" form="qf-noform" ${state.need === 'workshop' ? 'checked' : ''}>
                    <strong>Workshop</strong>
                    <span>30-day online workshop</span>
                </label>

                <label class="qf-opt ${state.need === 'training' ? 'is-sel' : ''}">
                    <input type="radio" name="qf-need" value="training" form="qf-noform" ${state.need === 'training' ? 'checked' : ''}>
                    <strong>Internship/Training</strong>
                    <span>Mentored, hands-on training in bioinformatics</span>
                </label>

                <label class="qf-opt ${state.need === 'research-training' ? 'is-sel' : ''}">
                    <input type="radio" name="qf-need" value="research-training" form="qf-noform" ${state.need === 'research-training' ? 'checked' : ''}>
                    <strong>Research Training</strong>
                    <span>6 months, mentored, a research paper we submit to a journal</span>
                </label>

                <label class="qf-opt ${state.need === 'data-analysis' ? 'is-sel' : ''}">
                    <input type="radio" name="qf-need" value="data-analysis" form="qf-noform" ${state.need === 'data-analysis' ? 'checked' : ''}>
                    <strong>Data analysis</strong>
                    <span>We analyse your sequencing or array data</span>
                </label>

                <label class="qf-opt qf-opt-w ${state.need === 'other' ? 'is-sel' : ''}">
                    <input type="radio" name="qf-need" value="other" form="qf-noform" ${state.need === 'other' ? 'checked' : ''}>
                    <strong>Other</strong>
                    <span>Collaboration, career guidance or a different question</span>
                </label>
            </fieldset>

            <div class="qf-err" id="qf-need-err" style="display:none">Please choose one option.</div>

            <div class="qf-actions">
                <button type="button" class="qf-btn" id="qf-btn-step1">Continue</button>
            </div>
        `;
    }

    function renderCountryOptions(selectedCode) {
        return COUNTRIES.map(c => {
            const isSel = selectedCode === c.code ? ' selected' : '';
            return `<option value="${c.code}"${isSel}>${escapeHtml(c.name)}</option>`;
        }).join('');
    }

    function renderWorkshopFeeBox() {
        if (!isPaymentActive() || state.country === 'IN' || (!state.country && isIndianTimeZone)) {
            return `
                <div class="qf-fee" id="qf-workshop-fee-box">
                    <div class="qf-price">₹5,999<small>per workshop</small></div>
                </div>
            `;
        }

        const intlUrl = getWorkshopIntlUrl(state.workshop);
        if (intlUrl) {
            let priceHtml = '₹5,999<small>per workshop</small>';
            let noteHtml = '';
            if (PAYMENT_INTL_FEE_TEXT) {
                priceHtml = escapeHtml(PAYMENT_INTL_FEE_TEXT);
                noteHtml = '<p class="qf-note" style="margin-top:6px;">you pay in your own currency</p>';
            } else {
                noteHtml = '<p class="qf-note" style="margin-top:6px;">Shown in your own currency at checkout.</p>';
            }
            return `
                <div class="qf-fee" id="qf-workshop-fee-box">
                    <div class="qf-price">${priceHtml}</div>
                    ${noteHtml}
                </div>
            `;
        }

        return `
            <div class="qf-fee" id="qf-workshop-fee-box">
                <div class="qf-feehead">Fee-based programme</div>
                <p style="margin: 8px 0 0; color: var(--qf-mut); font-size: 14px; line-height: 1.55;">Our team will share the fee in your currency after your enquiry.</p>
            </div>
        `;
    }

    function renderStep2() {
        const cfg = NEED_CONFIG[state.need] || { name: 'Programme' };
        let middleHtml = '';

        if (state.need === 'workshop') {
            let countryHtml = '';
            if (isPaymentActive()) {
                const countryNoteText = state.country ? `Paying from: ${escapeHtml(getCountryName(state.country))}` : '';
                countryHtml = `
                    <label class="qf-lab" for="qf-country">Which country are you paying from? *</label>
                    <select id="qf-country" class="qf-in" form="qf-noform">
                        <option value="">Select your country…</option>
                        <option value="IN"${state.country === 'IN' ? ' selected' : ''}>India</option>
                        ${renderCountryOptions(state.country)}
                    </select>
                    <div class="qf-err" id="qf-country-err" style="display:none">Please select your country.</div>
                    <div class="qf-tz" id="qf-country-note"${state.country ? '' : ' style="display:none"'}>${countryNoteText}</div>
                `;
            }

            let optionsHtml = '<option value="">Select a workshop...</option>';
            const currentSelectedLabel = getWorkshopLabel(state.workshop);
            workshopOptions.forEach(opt => {
                const sel = (state.workshop === opt.value || state.workshop === opt.text || currentSelectedLabel === opt.text) ? ' selected' : '';
                optionsHtml += `<option value="${escapeHtml(opt.value)}"${sel}>${escapeHtml(opt.text)}</option>`;
            });

            middleHtml = `
                ${countryHtml}

                <label class="qf-lab" for="qf-workshop-sel">WHICH WORKSHOP *</label>
                <select id="qf-workshop-sel" class="qf-in" form="qf-noform">
                    ${optionsHtml}
                </select>
                <div class="qf-err" id="qf-workshop-err" style="display:none">Please select a workshop.</div>

                ${renderWorkshopFeeBox()}
            `;
        } else if (state.need === 'training') {
            middleHtml = `
                <div class="qf-fee">
                    <div class="qf-feehead">Fee-based programme</div>
                </div>
            `;
        } else if (state.need === 'research-training') {
            middleHtml = `
                <div class="qf-fee">
                    <div class="qf-price">₹10,000<small>per month</small></div>
                </div>
            `;
        }

        const primaryBtnText = (state.need === 'workshop' && isWorkshopPaymentPath()) ? 'Continue to payment' : 'Continue';

        return `
            <h2 class="qf-h" tabindex="-1">Before you continue</h2>
            <p class="qf-sub">${escapeHtml(cfg.name)}</p>

            ${middleHtml}

            <label class="qf-check" for="qf-fee-agree">
                <input type="checkbox" id="qf-fee-agree" form="qf-noform" ${state.feeAgree ? 'checked' : ''}>
                <span>I understand this is a fee-based programme and I am ready to pay the fee.</span>
            </label>
            <div class="qf-err" id="qf-fee-err" style="display:none">Please confirm to continue.</div>

            <div class="qf-actions">
                <button type="button" class="qf-btn" id="qf-btn-step2">${primaryBtnText}</button>
                <button type="button" class="qf-btn-2" id="qf-btn-step2-back">Back</button>
            </div>
        `;
    }

    function renderStep3(stepNum, totalSteps) {
        const cfg = NEED_CONFIG[state.need] || { name: 'Details' };
        const isOther = (state.need === 'other');
        const reqStar = isOther ? '' : ' *';

        let customFieldsHtml = '';

        if (state.need === 'workshop') {
            customFieldsHtml = `
                <div class="qf-row">
                    <div>
                        <label class="qf-lab" for="qf-level">CURRENT LEVEL *</label>
                        <select id="qf-level" class="qf-in" form="qf-noform">
                            <option value="">Select...</option>
                            ${renderSelectOptions(['Undergraduate', 'Postgraduate', 'PhD', 'Working professional'], state.level)}
                        </select>
                        <div class="qf-err" id="qf-level-err" style="display:none">This field is required.</div>
                    </div>
                    <div>
                        <label class="qf-lab" for="qf-prog">PROGRAMMING EXPERIENCE *</label>
                        <select id="qf-prog" class="qf-in" form="qf-noform">
                            <option value="">Select...</option>
                            ${renderSelectOptions(['None', 'Basic', 'Comfortable'], state.programming)}
                        </select>
                        <div class="qf-err" id="qf-prog-err" style="display:none">This field is required.</div>
                    </div>
                </div>
                <div>
                    <label class="qf-lab" for="qf-anything">ANYTHING WE SHOULD KNOW?</label>
                    <textarea id="qf-anything" class="qf-in" form="qf-noform" placeholder="Describe your background, goals, or any specific questions...">${escapeHtml(state.anythingElse)}</textarea>
                </div>
            `;
        } else if (state.need === 'training') {
            customFieldsHtml = `
                <div class="qf-row">
                    <div>
                        <label class="qf-lab" for="qf-level">CURRENT LEVEL *</label>
                        <select id="qf-level" class="qf-in" form="qf-noform">
                            <option value="">Select...</option>
                            ${renderSelectOptions(['Undergraduate', 'Postgraduate', 'PhD', 'Working professional'], state.level)}
                        </select>
                        <div class="qf-err" id="qf-level-err" style="display:none">This field is required.</div>
                    </div>
                    <div>
                        <label class="qf-lab" for="qf-prog">PROGRAMMING EXPERIENCE *</label>
                        <select id="qf-prog" class="qf-in" form="qf-noform">
                            <option value="">Select...</option>
                            ${renderSelectOptions(['None', 'Basic', 'Comfortable'], state.programming)}
                        </select>
                        <div class="qf-err" id="qf-prog-err" style="display:none">This field is required.</div>
                    </div>
                </div>
                <div>
                    <label class="qf-lab" for="qf-learn">WHAT WOULD YOU LIKE TO DO OR LEARN? *</label>
                    <textarea id="qf-learn" class="qf-in" form="qf-noform" placeholder="Tell us about the topics, datasets, or skills you want to work on...">${escapeHtml(state.learnGoal)}</textarea>
                    <div class="qf-err" id="qf-learn-err" style="display:none">This field is required.</div>
                </div>
            `;
        } else if (state.need === 'research-training') {
            customFieldsHtml = `
                <div class="qf-row">
                    <div>
                        <label class="qf-lab" for="qf-level">CURRENT LEVEL *</label>
                        <select id="qf-level" class="qf-in" form="qf-noform">
                            <option value="">Select...</option>
                            ${renderSelectOptions(['Undergraduate', 'Postgraduate', 'PhD', 'Working professional'], state.level)}
                        </select>
                        <div class="qf-err" id="qf-level-err" style="display:none">This field is required.</div>
                    </div>
                    <div>
                        <label class="qf-lab" for="qf-prog">PROGRAMMING EXPERIENCE *</label>
                        <select id="qf-prog" class="qf-in" form="qf-noform">
                            <option value="">Select...</option>
                            ${renderSelectOptions(['None', 'Basic', 'Comfortable'], state.programming)}
                        </select>
                        <div class="qf-err" id="qf-prog-err" style="display:none">This field is required.</div>
                    </div>
                </div>
                <div>
                    <label class="qf-lab" for="qf-hours">HOW MANY HOURS PER WEEK CAN YOU DEDICATE? *</label>
                    <select id="qf-hours" class="qf-in" form="qf-noform">
                        <option value="">Select...</option>
                        ${renderSelectOptions(['5-10 hours', '10-20 hours', '20+ hours (full-time)'], state.hours)}
                    </select>
                    <div class="qf-err" id="qf-hours-err" style="display:none">This field is required.</div>
                </div>
                <div>
                    <label class="qf-lab" for="qf-area">RESEARCH AREA OR TOPIC OF INTEREST (OPTIONAL)</label>
                    <textarea id="qf-area" class="qf-in" form="qf-noform" placeholder="E.g. Cancer genomics, RNA biology, antimicrobial resistance, specific organisms...">${escapeHtml(state.researchArea)}</textarea>
                </div>
            `;
        } else if (state.need === 'data-analysis') {
            customFieldsHtml = `
                <div class="qf-row">
                    <div>
                        <label class="qf-lab" for="qf-datatype">DATA TYPE *</label>
                        <select id="qf-datatype" class="qf-in" form="qf-noform">
                            <option value="">Select...</option>
                            ${renderSelectOptions([
                                'Bulk RNA-seq',
                                'Single-cell RNA-seq',
                                'Spatial transcriptomics',
                                'WGS',
                                'WES',
                                'ATAC-seq / ChIP-seq',
                                'Metagenomics',
                                'DNA methylation',
                                'Other'
                            ], state.dataType)}
                        </select>
                        <div class="qf-err" id="qf-datatype-err" style="display:none">This field is required.</div>
                    </div>
                    <div>
                        <label class="qf-lab" for="qf-samples">NUMBER OF SAMPLES *</label>
                        <input type="number" id="qf-samples" class="qf-in" min="1" placeholder="e.g. 12" form="qf-noform" value="${escapeHtml(state.samples)}">
                        <div class="qf-err" id="qf-samples-err" style="display:none">Please enter at least 1 sample.</div>
                    </div>
                </div>
                <div class="qf-row">
                    <div>
                        <label class="qf-lab" for="qf-organism">ORGANISM *</label>
                        <input type="text" id="qf-organism" class="qf-in" placeholder="e.g. Human, mouse, rice" form="qf-noform" value="${escapeHtml(state.organism)}">
                        <div class="qf-err" id="qf-organism-err" style="display:none">This field is required.</div>
                    </div>
                    <div>
                        <label class="qf-lab" for="qf-budget">BUDGET IN MIND (OPTIONAL)</label>
                        <select id="qf-budget" class="qf-in" form="qf-noform">
                            ${renderSelectOptions([
                                'Not sure, send a quote',
                                'Under ₹50,000',
                                '₹50,000 - ₹1,50,000',
                                '₹1,50,000 - ₹3,00,000',
                                '₹3,00,000+'
                            ], state.budget || 'Not sure, send a quote')}
                        </select>
                    </div>
                </div>
                <div>
                    <label class="qf-lab" for="qf-question">WHAT QUESTION DO YOU WANT ANSWERED? *</label>
                    <textarea id="qf-question" class="qf-in" form="qf-noform" placeholder="Describe your project in a few lines...">${escapeHtml(state.question)}</textarea>
                    <div class="qf-err" id="qf-question-err" style="display:none">This field is required.</div>
                </div>
            `;
        } else if (state.need === 'other') {
            customFieldsHtml = `
                <div>
                    <label class="qf-lab" for="qf-topic">WHAT IS THIS ABOUT? *</label>
                    <select id="qf-topic" class="qf-in" form="qf-noform">
                        <option value="">Select...</option>
                        ${renderSelectOptions(['Collaboration', 'Career guidance', 'Something else'], state.otherTopic)}
                    </select>
                    <div class="qf-err" id="qf-topic-err" style="display:none">This field is required.</div>
                </div>
                <div>
                    <label class="qf-lab" for="qf-help">HOW CAN WE HELP? *</label>
                    <textarea id="qf-help" class="qf-in" form="qf-noform" placeholder="Tell us more about your query...">${escapeHtml(state.otherHelp)}</textarea>
                    <div class="qf-err" id="qf-help-err" style="display:none">This field is required.</div>
                </div>
            `;
        }

        const todayStr = getTodayString();

        return `
            <h2 class="qf-h" tabindex="-1">Your details</h2>
            <p class="qf-sub">${escapeHtml(cfg.name)}</p>

            <div class="qf-row">
                <div>
                    <label class="qf-lab" for="qf-name">FULL NAME *</label>
                    <input type="text" id="qf-name" class="qf-in" placeholder="Dr. Jane Doe" form="qf-noform" value="${escapeHtml(state.name)}">
                    <div class="qf-err" id="qf-name-err" style="display:none">This field is required.</div>
                </div>
                <div>
                    <label class="qf-lab" for="qf-email">EMAIL ADDRESS *</label>
                    <input type="email" id="qf-email" class="qf-in" placeholder="jane@institute.edu" form="qf-noform" value="${escapeHtml(state.email)}">
                    <div class="qf-err" id="qf-email-err" style="display:none">Please enter a valid email address.</div>
                </div>
            </div>

            <div class="qf-row">
                <div>
                    <label class="qf-lab" for="qf-phone">PHONE / WHATSAPP *</label>
                    <input type="tel" id="qf-phone" class="qf-in" placeholder="+91 98765 43210" form="qf-noform" value="${escapeHtml(state.phone)}">
                    <div class="qf-err" id="qf-phone-err" style="display:none">This field is required.</div>
                </div>
                <div>
                    <label class="qf-lab" for="qf-org">ORGANIZATION / INSTITUTION *</label>
                    <input type="text" id="qf-org" class="qf-in" placeholder="University of Genomics" form="qf-noform" value="${escapeHtml(state.org)}">
                    <div class="qf-err" id="qf-org-err" style="display:none">This field is required.</div>
                </div>
            </div>

            ${customFieldsHtml}

            <div class="qf-sec">When can we talk?</div>

            <div class="qf-row">
                <div>
                    <label class="qf-lab" for="qf-date">PREFERRED DATE${reqStar}</label>
                    <input type="date" id="qf-date" class="qf-in" min="${todayStr}" form="qf-noform" value="${escapeHtml(state.prefDate)}">
                    <div class="qf-err" id="qf-date-err" style="display:none">This field is required.</div>
                </div>
                <div>
                    <label class="qf-lab" for="qf-date-alt">ALTERNATIVE DATE</label>
                    <input type="date" id="qf-date-alt" class="qf-in" min="${todayStr}" form="qf-noform" value="${escapeHtml(state.altDate)}">
                </div>
            </div>

            <div>
                <label class="qf-lab" for="qf-time">PREFERRED TIME${reqStar}</label>
                <select id="qf-time" class="qf-in" form="qf-noform">
                    <option value="">Select...</option>
                    ${renderSelectOptions([
                        'Morning, 9 am to 12 pm IST',
                        'Afternoon, 12 pm to 4 pm IST',
                        'Evening, 4 pm to 8 pm IST'
                    ], state.prefTime)}
                </select>
                <div class="qf-err" id="qf-time-err" style="display:none">This field is required.</div>
            </div>

            <div class="qf-tz">
                Your time zone: ${escapeHtml(detectedTimeZone)} (detected). Times above are in India time (IST). We will confirm your call by email.
            </div>

            <label class="qf-check" for="qf-consent">
                <input type="checkbox" id="qf-consent" form="qf-noform" ${state.consent ? 'checked' : ''}>
                <span>I agree to the processing of my details according to the <a href="privacy.html" class="inline-link" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</span>
            </label>
            <div class="qf-err" id="qf-consent-err" style="display:none">Please tick to continue.</div>

            <div class="qf-actions">
                <button type="submit" class="qf-btn" id="qf-btn-submit">Submit Inquiry</button>
                <button type="button" class="qf-btn-2" id="qf-btn-step3-back">Back</button>
            </div>
        `;
    }

    function renderSelectOptions(list, selectedVal) {
        return list.map(item => {
            const isSel = selectedVal === item ? ' selected' : '';
            return `<option value="${escapeHtml(item)}"${isSel}>${escapeHtml(item)}</option>`;
        }).join('');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function updateStep2WorkshopState(container) {
        if (state.need !== 'workshop') return;

        const noteEl = container.querySelector('#qf-country-note');
        if (noteEl) {
            const countryName = getCountryName(state.country);
            if (countryName) {
                noteEl.textContent = `Paying from: ${countryName}`;
                noteEl.style.display = 'block';
            } else {
                noteEl.textContent = '';
                noteEl.style.display = 'none';
            }
        }

        const feeBox = container.querySelector('#qf-workshop-fee-box');
        if (feeBox) {
            feeBox.outerHTML = renderWorkshopFeeBox();
        }

        const btnStep2 = container.querySelector('#qf-btn-step2');
        if (btnStep2) {
            btnStep2.textContent = isWorkshopPaymentPath() ? 'Continue to payment' : 'Continue';
        }

        const stepsEl = container.querySelector('.qf-steps');
        if (stepsEl) {
            stepsEl.outerHTML = renderStepsIndicator(state.step, getTotalSteps());
        }
    }

    function bindEvents(container) {
        // Option selection in Step 1
        const radioInputs = container.querySelectorAll('input[name="qf-need"]');
        radioInputs.forEach(input => {
            input.addEventListener('change', () => {
                state.need = input.value;
                container.querySelectorAll('.qf-opt').forEach(l => l.classList.remove('is-sel'));
                input.closest('.qf-opt').classList.add('is-sel');
                hideError('qf-need-err');

                // Update steps indicator immediately on need change
                const stepsEl = container.querySelector('.qf-steps');
                if (stepsEl) {
                    stepsEl.outerHTML = renderStepsIndicator(state.step, getTotalSteps());
                }
            });
        });

        // Step 1 Continue
        const btnStep1 = container.querySelector('#qf-btn-step1');
        if (btnStep1) {
            btnStep1.addEventListener('click', () => {
                if (!state.need) {
                    showError('qf-need-err');
                    return;
                }
                state.step = 2;
                render(container);
            });
        }

        // Step 2 country change listener
        const countrySel = container.querySelector('#qf-country');
        if (countrySel) {
            countrySel.addEventListener('change', () => {
                state.country = countrySel.value;
                hideError('qf-country-err', countrySel);
                updateStep2WorkshopState(container);
            });
        }

        // Step 2 workshop select change listener
        const workshopSel = container.querySelector('#qf-workshop-sel');
        if (workshopSel) {
            workshopSel.addEventListener('change', () => {
                state.workshop = workshopSel.value;
                hideError('qf-workshop-err', workshopSel);
                updateStep2WorkshopState(container);
            });
        }

        // Step 2 Continue & Back
        const btnStep2 = container.querySelector('#qf-btn-step2');
        if (btnStep2) {
            btnStep2.addEventListener('click', () => {
                let hasErr = false;

                if (state.need === 'workshop') {
                    if (isPaymentActive()) {
                        const cSel = container.querySelector('#qf-country');
                        if (!cSel || !cSel.value) {
                            showError('qf-country-err', cSel);
                            hasErr = true;
                            if (cSel) cSel.focus();
                        } else {
                            state.country = cSel.value;
                            hideError('qf-country-err', cSel);
                        }
                    }

                    const sel = container.querySelector('#qf-workshop-sel');
                    if (!sel || !sel.value) {
                        showError('qf-workshop-err', sel);
                        if (!hasErr && sel) sel.focus();
                        hasErr = true;
                    } else {
                        state.workshop = sel.value;
                        hideError('qf-workshop-err', sel);
                    }
                }

                const chk = container.querySelector('#qf-fee-agree');
                if (!chk || !chk.checked) {
                    showError('qf-fee-err');
                    hasErr = true;
                } else {
                    state.feeAgree = true;
                    hideError('qf-fee-err');
                }

                if (hasErr) return;

                if (state.need === 'workshop' && isPaymentActive()) {
                    const sel = container.querySelector('#qf-workshop-sel');
                    let chosenLabel = '';
                    if (sel && sel.selectedIndex >= 0 && sel.options[sel.selectedIndex] && sel.value) {
                        chosenLabel = sel.options[sel.selectedIndex].text;
                    } else if (state.workshop) {
                        chosenLabel = getWorkshopLabel(state.workshop);
                    }

                    // 2a. India: Razorpay
                    if (state.country === 'IN') {
                        let targetUrl = PAYMENT_URL;
                        if (PAYMENT_WORKSHOP_PARAM) {
                            const param = encodeURIComponent(PAYMENT_WORKSHOP_PARAM);
                            const val = encodeURIComponent(chosenLabel);
                            const joiner = targetUrl.includes('?') ? '&' : '?';
                            targetUrl = `${targetUrl}${joiner}${param}=${val}`;
                        }
                        window.location.href = targetUrl;
                        return;
                    }

                    // 2b. Another country with PayGlocal link
                    const intlUrl = getWorkshopIntlUrl(chosenLabel);
                    if (intlUrl) {
                        let targetUrl = intlUrl;
                        if (PAYMENT_INTL_WORKSHOP_PARAM) {
                            const param = encodeURIComponent(PAYMENT_INTL_WORKSHOP_PARAM);
                            const val = encodeURIComponent(chosenLabel);
                            const joiner = targetUrl.includes('?') ? '&' : '?';
                            targetUrl = `${targetUrl}${joiner}${param}=${val}`;
                        }
                        window.location.href = targetUrl;
                        return;
                    }

                    // 2c. Another country and no PayGlocal link: enquiry details on Step 3
                    state.step = 3;
                    render(container);
                    return;
                }

                state.step = 3;
                render(container);
            });
        }

        const btnStep2Back = container.querySelector('#qf-btn-step2-back');
        if (btnStep2Back) {
            btnStep2Back.addEventListener('click', () => {
                saveStep2Inputs(container);
                state.step = 1;
                render(container);
            });
        }

        // Step 3 Back
        const btnStep3Back = container.querySelector('#qf-btn-step3-back');
        if (btnStep3Back) {
            btnStep3Back.addEventListener('click', () => {
                saveStep3Inputs(container);
                const isShortFlow = (state.need === 'data-analysis' || state.need === 'other');
                state.step = isShortFlow ? 1 : 2;
                render(container);
            });
        }

        // Enter key inside single-line inputs
        container.querySelectorAll('input:not([type="checkbox"]):not([type="radio"])').forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (state.step === 1) {
                        const b = container.querySelector('#qf-btn-step1');
                        if (b) b.click();
                    } else if (state.step === 2 && state.need !== 'data-analysis' && state.need !== 'other') {
                        const b = container.querySelector('#qf-btn-step2');
                        if (b) b.click();
                    } else {
                        const b = container.querySelector('#qf-btn-submit');
                        if (b) b.click();
                    }
                }
            });
        });
    }

    function saveStep2Inputs(container) {
        const cSel = container.querySelector('#qf-country');
        if (cSel) state.country = cSel.value;
        const sel = container.querySelector('#qf-workshop-sel');
        if (sel) state.workshop = sel.value;
        const chk = container.querySelector('#qf-fee-agree');
        if (chk) state.feeAgree = chk.checked;
    }

    function saveStep3Inputs(container) {
        const getVal = id => {
            const el = container.querySelector('#' + id);
            return el ? el.value : '';
        };
        state.name = getVal('qf-name');
        state.email = getVal('qf-email');
        state.phone = getVal('qf-phone');
        state.org = getVal('qf-org');
        state.level = getVal('qf-level');
        state.programming = getVal('qf-prog');
        state.hours = getVal('qf-hours');
        state.dataType = getVal('qf-datatype');
        state.samples = getVal('qf-samples');
        state.organism = getVal('qf-organism');
        state.budget = getVal('qf-budget');
        state.question = getVal('qf-question');
        state.learnGoal = getVal('qf-learn');
        state.researchArea = getVal('qf-area');
        state.anythingElse = getVal('qf-anything');
        state.otherTopic = getVal('qf-topic');
        state.otherHelp = getVal('qf-help');
        state.prefDate = getVal('qf-date');
        state.altDate = getVal('qf-date-alt');
        state.prefTime = getVal('qf-time');
        const consentEl = container.querySelector('#qf-consent');
        state.consent = consentEl ? consentEl.checked : false;
    }

    function showError(errId, inputEl) {
        const err = document.getElementById(errId);
        if (err) err.style.display = 'block';
        if (inputEl) inputEl.classList.add('is-bad');
    }

    function hideError(errId, inputEl) {
        const err = document.getElementById(errId);
        if (err) err.style.display = 'none';
        if (inputEl) inputEl.classList.remove('is-bad');
    }

    function validateStep3(container) {
        saveStep3Inputs(container);
        let firstBad = null;
        let valid = true;

        function mark(fieldId, errId, condition) {
            const el = container.querySelector('#' + fieldId);
            if (!condition) {
                showError(errId, el);
                valid = false;
                if (!firstBad && el) firstBad = el;
            } else {
                hideError(errId, el);
            }
        }

        mark('qf-name', 'qf-name-err', state.name.trim().length > 0);
        
        // Email validation
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        mark('qf-email', 'qf-email-err', emailRe.test(state.email.trim()));

        mark('qf-phone', 'qf-phone-err', state.phone.trim().length > 0);
        mark('qf-org', 'qf-org-err', state.org.trim().length > 0);

        if (state.need === 'workshop') {
            mark('qf-level', 'qf-level-err', state.level.length > 0);
            mark('qf-prog', 'qf-prog-err', state.programming.length > 0);
        } else if (state.need === 'training') {
            mark('qf-level', 'qf-level-err', state.level.length > 0);
            mark('qf-prog', 'qf-prog-err', state.programming.length > 0);
            mark('qf-learn', 'qf-learn-err', state.learnGoal.trim().length > 0);
        } else if (state.need === 'research-training') {
            mark('qf-level', 'qf-level-err', state.level.length > 0);
            mark('qf-prog', 'qf-prog-err', state.programming.length > 0);
            mark('qf-hours', 'qf-hours-err', state.hours.length > 0);
        } else if (state.need === 'data-analysis') {
            mark('qf-datatype', 'qf-datatype-err', state.dataType.length > 0);
            const num = parseInt(state.samples, 10);
            mark('qf-samples', 'qf-samples-err', !isNaN(num) && num >= 1);
            mark('qf-organism', 'qf-organism-err', state.organism.trim().length > 0);
            mark('qf-question', 'qf-question-err', state.question.trim().length > 0);
        } else if (state.need === 'other') {
            mark('qf-topic', 'qf-topic-err', state.otherTopic.length > 0);
            mark('qf-help', 'qf-help-err', state.otherHelp.trim().length > 0);
        }

        // Meeting fields: required for non-other
        if (state.need !== 'other') {
            mark('qf-date', 'qf-date-err', state.prefDate.length > 0);
            mark('qf-time', 'qf-time-err', state.prefTime.length > 0);
        }

        // Consent
        const consentEl = container.querySelector('#qf-consent');
        if (!state.consent) {
            showError('qf-consent-err');
            valid = false;
            if (!firstBad && consentEl) firstBad = consentEl;
        } else {
            hideError('qf-consent-err');
        }

        if (!valid && firstBad) {
            firstBad.focus();
        }
        return valid;
    }

    function mapToLegacy(form) {
        const legacyName = form.querySelector('input[name="name"]');
        const legacyEmail = form.querySelector('input[name="email"]');
        const legacyPhone = form.querySelector('input[name="phone"]');
        const legacyOrg = form.querySelector('input[name="organization"]');
        const legacyService = form.querySelector('select[name="service"]');
        const legacyMessage = form.querySelector('textarea[name="message"]');
        const legacyConsent = form.querySelector('input[name="consent"]');

        if (legacyName) legacyName.value = state.name.trim();
        if (legacyEmail) legacyEmail.value = state.email.trim();
        if (legacyPhone) legacyPhone.value = state.phone.trim();
        if (legacyOrg) legacyOrg.value = state.org.trim();
        if (legacyConsent) legacyConsent.checked = true;

        // Map service value
        if (legacyService) {
            let targetVal = 'other';
            if (state.need === 'workshop') {
                targetVal = state.workshop || 'workshop';
            } else if (state.need === 'training') {
                targetVal = 'internship';
            } else if (state.need === 'research-training') {
                targetVal = 'internship';
            } else if (state.need === 'data-analysis') {
                const dt = state.dataType;
                if (['Bulk RNA-seq', 'Single-cell RNA-seq', 'Spatial transcriptomics'].includes(dt)) {
                    targetVal = 'rna';
                } else if (['ATAC-seq / ChIP-seq', 'DNA methylation'].includes(dt)) {
                    targetVal = 'epi';
                } else if (dt === 'WGS') {
                    targetVal = 'wgs';
                } else if (dt === 'WES') {
                    targetVal = 'wes';
                } else if (dt === 'Metagenomics') {
                    targetVal = 'meta';
                } else {
                    targetVal = 'other';
                }
            } else if (state.need === 'other') {
                if (state.otherTopic === 'Collaboration') {
                    targetVal = 'college';
                } else if (state.otherTopic === 'Career guidance') {
                    targetVal = 'career';
                } else {
                    targetVal = 'other';
                }
            }

            // Set select value
            for (let i = 0; i < legacyService.options.length; i++) {
                const opt = legacyService.options[i];
                if (opt.value === targetVal || opt.text === targetVal) {
                    legacyService.selectedIndex = i;
                    legacyService.value = opt.value;
                    break;
                }
            }
        }

        // Map message textarea
        const cardName = NEED_CONFIG[state.need] ? NEED_CONFIG[state.need].name : state.need;
        const lines = [];
        lines.push(`Request: ${cardName}`);

        if (state.country) {
            const countryName = getCountryName(state.country);
            if (countryName) {
                lines.push(`Country: ${countryName}`);
            }
        }

        if (state.need === 'workshop' && state.workshop) {
            lines.push(`Selected workshop: ${state.workshop}`);
        }
        if (state.level) lines.push(`Current level: ${state.level}`);
        if (state.programming) lines.push(`Programming experience: ${state.programming}`);
        if (state.hours) lines.push(`Hours per week: ${state.hours}`);
        if (state.dataType) lines.push(`Data type: ${state.dataType}`);
        if (state.samples) lines.push(`Number of samples: ${state.samples}`);
        if (state.organism) lines.push(`Organism: ${state.organism}`);
        if (state.budget) lines.push(`Budget: ${state.budget}`);

        if (state.need === 'research-training' && state.researchArea) {
            lines.push(`Research area / Topic: ${state.researchArea.trim()}`);
        } else if (state.need === 'other' && state.otherTopic) {
            lines.push(`Topic: ${state.otherTopic}`);
        }

        let customMsg = '';
        if (state.need === 'workshop') customMsg = state.anythingElse;
        else if (state.need === 'training') customMsg = state.learnGoal;
        else if (state.need === 'research-training') customMsg = state.researchArea;
        else if (state.need === 'data-analysis') customMsg = state.question;
        else if (state.need === 'other') customMsg = state.otherHelp;

        if (customMsg && customMsg.trim()) {
            lines.push(`Message: ${customMsg.trim()}`);
        }

        if (['workshop', 'training', 'research-training'].includes(state.need) && state.feeAgree) {
            lines.push(`Fee understood: Yes, confirmed by the visitor`);
        }

        if (state.prefDate) lines.push(`Preferred date: ${state.prefDate}`);
        if (state.altDate) lines.push(`Alternative date: ${state.altDate}`);
        if (state.prefTime) lines.push(`Preferred time: ${state.prefTime}`);
        if (detectedTimeZone) lines.push(`Visitor time zone: ${detectedTimeZone}`);

        if (legacyMessage) {
            legacyMessage.value = lines.join('\n');
        }
    }

    function setupBookingObserver(form, container) {
        const statusMsg = document.getElementById('form-status');
        if (!statusMsg) return;

        let bookingInserted = false;

        function checkSuccess() {
            const hasSuccess = statusMsg.classList.contains('success') ||
                               statusMsg.textContent.includes('Thank you') ||
                               statusMsg.textContent.includes('enquiry has been submitted');
            if (hasSuccess) {
                container.style.display = 'none';

                if (!bookingInserted && BOOKING_URL && BOOKING_URL.startsWith('https://')) {
                    bookingInserted = true;
                    let targetUrl = BOOKING_URL;
                    if (BOOKING_PREFILL) {
                        const nameParam = encodeURIComponent(state.name.trim());
                        const emailParam = encodeURIComponent(state.email.trim());
                        const joiner = targetUrl.includes('?') ? '&' : '?';
                        targetUrl = `${targetUrl}${joiner}name=${nameParam}&email=${emailParam}`;
                    }

                    const bookingCard = document.createElement('div');
                    bookingCard.className = 'qf-fee qf-book';
                    bookingCard.innerHTML = `
                        <h2 class="qf-h">Book your first call</h2>
                        <p>Choose a time that suits you for a short first call with our team.</p>
                        <a href="${escapeHtml(targetUrl)}" class="qf-btn" target="_blank" rel="noopener noreferrer">Choose a time</a>
                        <div class="qf-note">Opens our scheduling page in a new tab.</div>
                    `;
                    statusMsg.parentNode.insertBefore(bookingCard, statusMsg.nextSibling);
                }
            }
        }

        const observer = new MutationObserver(() => {
            checkSuccess();
        });

        observer.observe(statusMsg, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
        });
    }

    function init() {
        const form = document.getElementById('quote-form');
        const flowContainer = document.getElementById('qf-flow');
        if (!form || !flowContainer) return;

        // Default country based on timezone if detected
        if (isIndianTimeZone) {
            state.country = 'IN';
        } else {
            state.country = '';
        }

        // 1. Mark JS mode on root
        document.documentElement.classList.add('qf-js');

        // 2. Remove required attributes from legacy controls
        form.querySelectorAll('.qf-legacy [required]').forEach(el => {
            el.removeAttribute('required');
        });

        // 3. Unhide flow container
        flowContainer.removeAttribute('hidden');

        // 4. Initialize options and check prefill
        initLegacyOptions(form);
        checkPrefill(form);

        // 5. Initial render
        render(flowContainer);

        // 6. Submit interceptor (Capture phase)
        form.addEventListener('submit', function (e) {
            // Only validate flow when flow is active/visible
            if (flowContainer.style.display === 'none') {
                return;
            }

            const targetSubmitStep = getTotalSteps();

            if (state.step !== targetSubmitStep) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return;
            }

            const isValid = validateStep3(flowContainer);
            if (!isValid) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return;
            }

            // Map values to legacy controls so existing handler can serialize them
            mapToLegacy(form);
        }, true);

        // 7. Setup Booking Observer on #form-status
        setupBookingObserver(form, flowContainer);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
