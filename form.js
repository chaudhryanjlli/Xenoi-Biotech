// form.js - Asynchronous contact form handling & service pre-selection for Xenoi Biotech (Web3Forms API)

function initServiceParam() {
    const params = new URLSearchParams(window.location.search);
    const serviceParam = params.get('service');
    if (serviceParam) {
        const serviceSelect = document.getElementById('service');
        if (serviceSelect) {
            const normalized = serviceParam.toLowerCase();
            for (let i = 0; i < serviceSelect.options.length; i++) {
                const opt = serviceSelect.options[i];
                if (opt.value.toLowerCase() === normalized || opt.text.toLowerCase().includes(normalized)) {
                    serviceSelect.value = opt.value;
                    break;
                }
            }
        }
    }
}

function sanitizeText(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/[<>]/g, '')
        .trim();
}

document.addEventListener('DOMContentLoaded', () => {
    initServiceParam();

    const form = document.getElementById('quote-form');
    const statusMsg = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');

    if (!form) return;

    let isSubmitting = false;

    function showStatus(type, message, isHtmlFallback = false) {
        if (!statusMsg) return;
        statusMsg.className = `form-status-msg ${type}`;
        if (isHtmlFallback) {
            // Safe static fallback containing email link without user input
            statusMsg.textContent = '';
            const textBefore = document.createTextNode("We couldn't send your enquiry. Please email us at ");
            const emailLink = document.createElement('a');
            emailLink.href = 'mailto:explore@xenoibiotech.com';
            emailLink.className = 'inline-link';
            emailLink.textContent = 'explore@xenoibiotech.com';
            const textAfter = document.createTextNode('.');
            statusMsg.appendChild(textBefore);
            statusMsg.appendChild(emailLink);
            statusMsg.appendChild(textAfter);
        } else {
            statusMsg.textContent = message;
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Double-submit prevention
        if (isSubmitting) return;

        // 2. Honeypot check: silently stop if honeypot is filled
        const botcheck = form.querySelector('input[name="botcheck"]');
        if (botcheck) {
            if (botcheck.type === 'checkbox' && botcheck.checked) {
                return;
            }
            if (botcheck.type !== 'checkbox' && botcheck.value && botcheck.value.trim() !== '') {
                return;
            }
        }

        // 3. HTML5 Validation check
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const accessKeyInput = form.querySelector('input[name="access_key"]');
        const accessKey = accessKeyInput ? accessKeyInput.value.trim() : '';

        // If no access key is present, display fallback message
        if (!accessKey) {
            showStatus('error', '', true);
            return;
        }

        const nameInput = form.querySelector('input[name="name"]');
        const emailInput = form.querySelector('input[name="email"]');
        const orgInput = form.querySelector('input[name="organization"]');
        const serviceInput = form.querySelector('select[name="service"]');
        const detailsInput = form.querySelector('textarea[name="message"]');
        const consentInput = form.querySelector('input[name="consent"]');

        const rawName = nameInput ? nameInput.value : '';
        const rawEmail = emailInput ? emailInput.value : '';
        const rawOrg = orgInput ? orgInput.value : '';
        const selectedServiceText = serviceInput && serviceInput.selectedIndex >= 0 ? serviceInput.options[serviceInput.selectedIndex].text : '';
        const rawDetails = detailsInput ? detailsInput.value : '';
        const isConsent = consentInput ? consentInput.checked : false;

        const cleanEmail = sanitizeText(rawEmail);
        let cleanName = sanitizeText(rawName);

        // If name is empty, fallback to part of email before @
        if (!cleanName && cleanEmail.includes('@')) {
            cleanName = sanitizeText(cleanEmail.split('@')[0]);
        }
        if (!cleanName) {
            cleanName = 'Visitor';
        }

        // from_name = "<Name>" only (trim, strip line breaks & angle brackets, max 25 chars)
        const fromName = cleanName.slice(0, 25).trim();

        // subject = "<Email> - New enquiry from <Name>" (email FIRST, max ~110 chars)
        const rawSubject = `${cleanEmail} - New enquiry from ${fromName}`;
        const subject = rawSubject.slice(0, 110).trim();

        const payload = {
            access_key: accessKey,
            from_name: fromName,
            subject: subject,
            email: cleanEmail,
            name: rawName.trim(),
            organization: rawOrg.trim(),
            service: selectedServiceText || (serviceInput ? serviceInput.value : ''),
            message: rawDetails.trim(),
            consent: isConsent ? 'I agree to the Privacy Policy' : 'No',
            botcheck: botcheck && botcheck.checked ? true : false
        };

        isSubmitting = true;
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Submit Inquiry';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Sending... <span class="btn-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>';
        }

        showStatus('info', 'Sending your inquiry...');

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.status === 200 && result.success === true) {
                showStatus('success', 'Thank you! Your enquiry has been submitted. We will reply to your enquiry by email.');
                form.reset();
            } else {
                showStatus('error', '', true);
            }
        } catch (error) {
            showStatus('error', '', true);
        } finally {
            isSubmitting = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }
        }
    });
});
