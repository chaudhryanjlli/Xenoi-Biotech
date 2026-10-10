// enquiry-prefill.js - Query string prefill for Xenoi Biotech quote/contact form
(function () {
    'use strict';

    const WORKSHOP_MAP = {
        'rna-seq-reference': 'Workshop – RNA-Seq (reference-based)',
        'rna-seq-de-novo': 'Workshop – RNA-Seq (de novo)',
        'single-cell-rna-seq': 'Workshop – Single-cell RNA-Seq',
        'lncrna-seq': 'Workshop – lncRNA-Seq',
        'mirna-seq': 'Workshop – miRNA-Seq',
        'psi-seq': 'Workshop – PSI-Seq (alternative splicing)',
        'spatial-transcriptomics': 'Workshop – Spatial Transcriptomics',
        'chip-seq': 'Workshop – ChIP-Seq',
        'snap-chip': 'Workshop – SNAP-ChIP (spike-in calibrated)',
        'atac-seq': 'Workshop – ATAC-Seq',
        'single-cell-atac-seq': 'Workshop – Single-cell ATAC-Seq',
        'methyl-seq': 'Workshop – Methyl-Seq (DNA methylation)',
        'dna-seq': 'Workshop – DNA-Seq (variant analysis)',
        'rad-seq': 'Workshop – RAD-Seq',
        'genome-assembly': 'Workshop – Whole-Genome de novo Assembly',
        'targeted-metagenomics': 'Workshop – Targeted Metagenomics (16S / ITS)',
        'shotgun-metagenomics': 'Workshop – Whole-Genome (Shotgun) Metagenomics',
        'microarray': 'Workshop – Microarray Data Analysis'
    };

    function initPrefill() {
        const serviceSelect = document.getElementById('service');
        if (!serviceSelect) return;

        const params = new URLSearchParams(window.location.search);
        const workshopSlug = params.get('workshop');
        const interestParam = params.get('interest');

        let targetValue = null;

        if (workshopSlug) {
            const slug = workshopSlug.toLowerCase().trim();
            if (Object.prototype.hasOwnProperty.call(WORKSHOP_MAP, slug)) {
                targetValue = WORKSHOP_MAP[slug];
            }
        } else if (interestParam) {
            const interest = interestParam.toLowerCase().trim();
            if (interest === 'customised-internship') {
                targetValue = 'Customised internship';
            }
        }

        if (targetValue) {
            for (let i = 0; i < serviceSelect.options.length; i++) {
                const opt = serviceSelect.options[i];
                if (opt.value === targetValue || opt.text === targetValue) {
                    serviceSelect.selectedIndex = i;
                    serviceSelect.value = opt.value;
                    break;
                }
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPrefill);
    } else {
        initPrefill();
    }
})();
