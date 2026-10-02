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

document.addEventListener('DOMContentLoaded', () => {
    initServiceParam();

    const form = document.getElementById('quote-form');
    const statusMsg = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');

    if (!form) return;

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

        // 1. Honeypot check: Ignore submission if honeypot is filled
        const botcheck = form.querySelector('input[name="botcheck"]');
        if (botcheck) {
            if (botcheck.type === 'checkbox' && botcheck.checked) {
                return;
            }
            if (botcheck.type !== 'checkbox' && botcheck.value && botcheck.value.trim() !== '') {
                return;
            }
        }

        // 2. HTML5 Validation check
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const accessKeyInput = form.querySelector('input[name="access_key"]');
        const accessKey = accessKeyInput ? accessKeyInput.value.trim() : '';

        // 3. If placeholder access key is detected, display fallback message
        if (!accessKey || accessKey === 'PASTE_YOUR_ACCESS_KEY') {
            showStatus('error', '', true);
            return;
        }

        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Submit Inquiry';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Sending... <span class="btn-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>';
        }

        showStatus('info', 'Sending your inquiry...');

        const formData = new FormData(form);

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                body: formData
            });

            const result = await response.json();

            if (response.status === 200 && result.success) {
                showStatus('success', 'Thank you! Your enquiry has been submitted. We will reply to your enquiry by email.');
                form.reset();
            } else {
                showStatus('error', '', true);
            }
        } catch (error) {
            showStatus('error', '', true);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }
        }
    });
});
