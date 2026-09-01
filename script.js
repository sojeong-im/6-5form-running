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
            
            // 3. Hide it so it doesn't block interactions
            setTimeout(() => {
                introScreen.classList.add('hidden');
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
        
        if (currentStep === 0) {
            // Restore intro screen
            introScreen.classList.remove('hidden');
            setTimeout(() => {
                introScreen.style.transform = 'translateY(0)';
                // Reset button and runner
                btnStartText.innerHTML = '지원하기 <span class="animate-bounce inline-block text-3xl">👇</span>';
                btnStart.classList.remove('bg-white', 'scale-110');
                btnStart.classList.add('hover:scale-105');
                introRunner.style.transition = 'none';
                introRunner.style.opacity = '0';
                introRunner.style.left = '-200px';
            }, 10);
            return;
        }

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
        btnPrev.classList.remove('hidden');
        if (btnNext.classList.contains('w-full')) {
            btnNext.classList.replace('w-full', 'w-2/3');
        }
        
        if (currentStep === 0) {
            btnPrev.textContent = '메인으로';
        } else {
            btnPrev.textContent = '이전';
        }

        if (currentStep === totalSteps - 1) {
            btnNext.classList.add('hidden');
            btnSubmit.classList.remove('hidden');
            btnSubmit.classList.replace('w-full', 'w-2/3');
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

    // --- Ounwan Logic ---
    const btnOunwan = document.getElementById('btn-ounwan');
    const ounwanScreen = document.getElementById('ounwan-screen');
    const btnCloseOunwan = document.getElementById('btn-close-ounwan');
    const ounwanFeed = document.getElementById('ounwan-feed');
    
    const btnOpenUpload = document.getElementById('btn-open-upload');
    const ounwanUploadModal = document.getElementById('ounwan-upload-modal');
    const btnCloseUpload = document.getElementById('btn-close-upload');
    const ounwanForm = document.getElementById('ounwan-form');
    
    const photoUploadInput = document.getElementById('ounwan-photo');
    const photoPreview = document.getElementById('photo-preview');
    const photoPlaceholder = document.getElementById('photo-placeholder');

    const mockOunwanData = [
        { id: 15, image: 'assets/media_1788220424652.jpg', date: '2026-08-10', content: '야간 러닝 최고! 🌃' },
        { id: 14, image: 'assets/media_1788220699372.jpg', date: '2026-07-25', content: '러닝 후 마시는 커피 한잔의 여유 ☕️' },
        { id: 13, image: 'assets/media_1788220767803.jpg', date: '2026-07-10', content: '트랙에서 기록 측정의 날 ⏱️ 달리기 딱 좋은 날씨!' },
        { id: 12, image: 'assets/media_1788220423018.jpg', date: '2026-06-25', content: '여름이 다가온다! 땀 빼니까 개운해요 ✨' },
        { id: 11, image: 'assets/media_1788220687602.jpg', date: '2026-06-15', content: '날씨가 너무 맑아서 뛰기 좋았어요 ☁️' },
        { id: 10, image: 'assets/media_1788220755950.jpg', date: '2026-06-05', content: '새로 산 러닝화 개시! 완전 푹신해요 👟' },
        { id: 9, image: 'assets/media_1788220421220.jpg', date: '2026-05-25', content: '오랜만에 한강공원 러닝 🏃‍♀️' },
        { id: 8, image: 'assets/media_1788220749801.jpg', date: '2026-05-15', content: '오늘은 가볍게 산책 느낌으로 러닝 🚶‍♀️' },
        { id: 7, image: 'assets/media_1788220686651.jpg', date: '2026-05-02', content: '다리 밑에서 쉬면서 한 컷 📸' },
        { id: 6, image: 'assets/media_1788220419912.jpg', date: '2026-04-25', content: '퇴근 후 스트레스 풀기 완료 🔥' },
        { id: 5, image: 'assets/media_1788220685034.jpg', date: '2026-04-10', content: '오늘 노을 너무 예쁘다 🌅' },
        { id: 4, image: 'assets/media_1788220748488.jpg', date: '2026-04-01', content: '러닝 끝나고 다같이 모여서 휴식 중! 😌' },
        { id: 3, image: 'assets/media_1788220417456.jpg', date: '2026-03-20', content: '봄 바람 맞으며 가볍게 5km 런! 🌸' },
        { id: 2, image: 'assets/media_1788220746836.jpg', date: '2026-03-10', content: '다 같이 달리기 전 화이팅! 🤜🤛' },
        { id: 1, image: 'assets/media_1788220681677.jpg', date: '2026-03-01', content: '새로운 마음으로 시작! 💪' }
    ];

    function renderOunwanFeed() {
        ounwanFeed.innerHTML = '';
        if (mockOunwanData.length === 0) {
            ounwanFeed.innerHTML = '<div class="text-center text-zinc-500 mt-10">첫 번째 인증을 올려주세요!</div>';
            return;
        }

        mockOunwanData.forEach(data => {
            const card = document.createElement('div');
            card.className = 'bg-zinc-800 rounded-2xl p-4 mb-5 shadow-lg border border-zinc-700';
            card.innerHTML = `
                <div class="flex justify-between items-center mb-3">
                    <span class="font-bold text-white">🏃 동아리원</span>
                    <span class="text-sm text-zinc-400">${data.date}</span>
                </div>
                <img src="${data.image}" alt="오운완 인증" class="w-full h-64 object-cover rounded-xl mb-3">
                <p class="text-zinc-200 leading-relaxed">${data.content}</p>
            `;
            ounwanFeed.appendChild(card);
        });
    }

    if (btnOunwan) {
        btnOunwan.addEventListener('click', () => {
            renderOunwanFeed();
            ounwanScreen.classList.remove('hidden');
            ounwanScreen.classList.add('flex');
            setTimeout(() => {
                ounwanScreen.classList.remove('opacity-0');
            }, 10);
        });
    }

    if (btnCloseOunwan) {
        btnCloseOunwan.addEventListener('click', () => {
            ounwanScreen.classList.add('opacity-0');
            setTimeout(() => {
                ounwanScreen.classList.add('hidden');
                ounwanScreen.classList.remove('flex');
            }, 500);
        });
    }

    if (btnOpenUpload) {
        btnOpenUpload.addEventListener('click', () => {
            ounwanUploadModal.classList.remove('hidden');
            setTimeout(() => {
                ounwanUploadModal.classList.remove('opacity-0');
                ounwanUploadModal.querySelector('div').classList.remove('scale-95');
            }, 10);
        });
    }

    if (btnCloseUpload) {
        btnCloseUpload.addEventListener('click', () => {
            ounwanUploadModal.classList.add('opacity-0');
            ounwanUploadModal.querySelector('div').classList.add('scale-95');
            setTimeout(() => {
                ounwanUploadModal.classList.add('hidden');
                // Reset form
                ounwanForm.reset();
                photoPreview.classList.add('hidden');
                photoPreview.src = '';
                photoPlaceholder.classList.remove('hidden');
            }, 300);
        });
    }

    if (photoUploadInput) {
        photoUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    photoPreview.src = e.target.result;
                    photoPreview.classList.remove('hidden');
                    photoPlaceholder.classList.add('hidden');
                }
                reader.readAsDataURL(file);
            }
        });
    }

    if (ounwanForm) {
        ounwanForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const codeInput = document.getElementById('ounwan-code').value;
            if (codeInput !== 'RUN2026') {
                alert('회원 코드가 올바르지 않습니다.');
                return;
            }

            const date = document.getElementById('ounwan-date').value;
            const content = document.getElementById('ounwan-content').value;
            const imgSrc = photoPreview.src;

            if (!imgSrc) {
                alert('사진을 업로드해주세요!');
                return;
            }

            // Add new data to the top
            const newData = {
                id: Date.now(),
                image: imgSrc,
                date: date,
                content: content
            };

            mockOunwanData.unshift(newData);
            renderOunwanFeed();
            
            // Close modal
            btnCloseUpload.click();
            
            // Scroll to top of feed
            ounwanFeed.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
