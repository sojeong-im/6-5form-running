import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBl0m-be83f0TGtxWHSC1zze1qWq_Sm7no",
  authDomain: "unning-minjok.firebaseapp.com",
  projectId: "unning-minjok",
  storageBucket: "unning-minjok.firebasestorage.app",
  messagingSenderId: "773747570084",
  appId: "1:773747570084:web:d8fc76d2849689b3f13d31",
  measurementId: "G-PW9RPRZ30S"
};

let db;
let analytics;
try {
    const app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    db = getFirestore(app);
} catch (error) {
    console.error("Firebase 초기화 에러:", error);
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Intro Screen Logic ---
    const introScreen = document.getElementById('intro-screen');
    const btnStart = document.getElementById('btn-start');
    const btnStartText = document.getElementById('btn-start-text');
    const introRunner = document.getElementById('intro-runner');

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            // Change button style to look like it was activated
            btnStartText.innerHTML = '출발! <span class="inline-block text-3xl ml-1">💨</span>';
            btnStart.classList.add('bg-white', 'scale-110');
            btnStart.classList.remove('hover:scale-105');
            
            // 1. Show and dash the runner across the screen
            introRunner.style.opacity = '1';
            introRunner.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            introRunner.style.left = '120vw'; 

            // 2. Slide the whole intro screen UP after the runner passes
            setTimeout(() => {
                introScreen.style.transform = 'translateY(-100vh)';
            }, 350);
            
            // 3. Remove from DOM completely so it doesn't block interactions
            setTimeout(() => {
                introScreen.remove();
            }, 1000);
        });
    }

    // --- Form Logic ---
    const steps = document.querySelectorAll('.form-step');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnSubmit = document.getElementById('btn-submit');
    const stepIndicator = document.getElementById('step-indicator');
    const progressFill = document.getElementById('progress-fill');
    const runnerIcon = document.getElementById('runner-icon');
    const form = document.getElementById('apply-form');
    
    let currentStep = 0;
    const totalSteps = steps.length;

    // Initialize UI
    updateUI();

    btnNext.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (validateStep(currentStep)) {
            // Animate runner jumping when moving forward
            runnerIcon.style.transform = 'translateY(-15px) scaleX(-1) rotate(-10deg)';
            setTimeout(() => {
                runnerIcon.style.transform = 'translateY(-50%) scaleX(-1) rotate(0deg)';
            }, 300);

            // Transition logic
            steps[currentStep].classList.remove('slide-in-right');
            steps[currentStep].classList.add('slide-out-left');
            
            setTimeout(() => {
                steps[currentStep].classList.add('hidden');
                steps[currentStep].classList.remove('slide-out-left', 'active');
                
                currentStep++;
                
                steps[currentStep].classList.remove('hidden');
                steps[currentStep].classList.add('slide-in-right', 'active');
                
                // Scroll to top of the main container smoothly
                document.querySelector('main').scrollTo({ top: 0, behavior: 'smooth' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                updateUI();
            }, 350);
        } else {
            // Trigger haptic feedback if available on mobile
            if (navigator.vibrate) navigator.vibrate(200);
        }
    });

    btnPrev.addEventListener('click', (e) => {
        e.preventDefault();
        
        steps[currentStep].classList.remove('slide-in-right');
        steps[currentStep].classList.add('hidden', 'active');
        
        currentStep--;
        
        steps[currentStep].classList.remove('hidden', 'slide-out-left');
        steps[currentStep].classList.add('slide-in-right', 'active');
        
        document.querySelector('main').scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        updateUI();
    });

    btnSubmit.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (validateStep(currentStep)) {
            // 제출 버튼 비활성화 및 로딩 표시
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '제출 중... <span class="animate-spin text-2xl ml-1">⏳</span>';
            btnSubmit.disabled = true;

            try {
                // Form 데이터 수집
                const formData = new FormData(form);
                const data = {};
                for (const [key, value] of formData.entries()) {
                    if (data[key]) {
                        if (!Array.isArray(data[key])) {
                            data[key] = [data[key]];
                        }
                        data[key].push(value);
                    } else {
                        data[key] = value;
                    }
                }
                
                // Firestore에 데이터 저장 (applications 컬렉션)
                if (db) {
                    data.createdAt = serverTimestamp();
                    await addDoc(collection(db, "applications"), data);
                } else {
                    console.warn("Firebase가 초기화되지 않았습니다. 데이터를 콘솔에 출력합니다.", data);
                }

                // Show Success Modal
                const modal = document.getElementById('success-modal');
                const card = document.getElementById('success-card');
                
                modal.classList.remove('hidden');
                // small delay to allow display:block to apply before animating opacity
                setTimeout(() => {
                    modal.classList.remove('opacity-0');
                    card.classList.remove('scale-90');
                }, 10);
            } catch (error) {
                console.error("데이터 제출 오류:", error);
                alert("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
            } finally {
                // 버튼 상태 복구
                btnSubmit.innerHTML = originalText;
                btnSubmit.disabled = false;
            }
        } else {
            if (navigator.vibrate) navigator.vibrate(200);
        }
    });

    function updateUI() {
        // Update Buttons
        if (currentStep === 0) {
            btnPrev.classList.add('hidden');
            btnNext.classList.replace('w-2/3', 'w-full');
        } else {
            btnPrev.classList.remove('hidden');
            btnNext.classList.replace('w-full', 'w-2/3');
        }

        if (currentStep === totalSteps - 1) {
            btnNext.classList.add('hidden');
            btnSubmit.classList.remove('hidden');
            if(currentStep !== 0) btnSubmit.classList.replace('w-full', 'w-2/3');
        } else {
            btnNext.classList.remove('hidden');
            btnSubmit.classList.add('hidden');
        }

        // Update Progress Bar
        stepIndicator.textContent = `${currentStep + 1} / ${totalSteps}`;
        const progressPercentage = ((currentStep + 1) / totalSteps) * 100;
        progressFill.style.width = `${progressPercentage}%`;
        
        // Offset the runner slightly so it stays visually within bounds
        const runnerPos = currentStep === totalSteps - 1 ? 100 : progressPercentage;
        runnerIcon.style.left = `${runnerPos}%`;
    }

    function validateStep(stepIndex) {
        const step = steps[stepIndex];
        const inputs = step.querySelectorAll('input[required], textarea[required]');
        let isValid = true;
        let firstInvalidElement = null;
        
        // 1. Check standard text/number/tel inputs
        inputs.forEach(input => {
            if (input.type !== 'radio' && input.type !== 'checkbox') {
                if (!input.value.trim()) {
                    isValid = false;
                    input.classList.add('input-error');
                    if (!firstInvalidElement) firstInvalidElement = input;
                    
                    input.addEventListener('input', function() {
                        this.classList.remove('input-error');
                    }, { once: true });
                }
            }
        });

        // 2. Check required radio groups
        const radioGroups = new Set();
        step.querySelectorAll('input[type="radio"][required]').forEach(radio => {
            radioGroups.add(radio.name);
        });

        radioGroups.forEach(name => {
            const checked = step.querySelector(`input[name="${name}"]:checked`);
            if (!checked) {
                isValid = false;
                const container = step.querySelector(`input[name="${name}"]`).closest('.grid');
                container.classList.add('group-error');
                
                if (!firstInvalidElement) firstInvalidElement = container;
                
                step.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
                    radio.addEventListener('change', () => {
                        container.classList.remove('group-error');
                    }, { once: true });
                });
            }
        });

        // If invalid, scroll to the first invalid element
        if (!isValid && firstInvalidElement) {
            firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        return isValid;
    }
});
