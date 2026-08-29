import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBl0m-be83f0TGtxWHSC1zze1qWq_Sm7no",
  authDomain: "unning-minjok.firebaseapp.com",
  projectId: "unning-minjok",
  storageBucket: "unning-minjok.firebasestorage.app",
  messagingSenderId: "773747570084",
  appId: "1:773747570084:web:d8fc76d2849689b3f13d31"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const applicantList = document.getElementById('applicant-list');
const totalCount = document.getElementById('total-count');
const refreshBtn = document.getElementById('refresh-btn');
const detailModal = document.getElementById('detail-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalName = document.getElementById('modal-name');
const modalContent = document.getElementById('modal-content');

let applicationsData = [];

// Mapping helpers
const levelMap = {
    "1": "거의 처음 🐣",
    "2": "뛰다 걷다 🚶🏃",
    "3": "3km 가능 🏃‍♀️",
    "4": "5km 이상 🔥",
    "5": "꾸준히 💨"
};

const dayMap = {
    "mon": "월", "tue": "화", "wed": "수", "thu": "목", "fri": "금", "sat": "토", "sun": "일"
};

const formatDays = (days) => {
    if (!days) return '-';
    const daysArr = Array.isArray(days) ? days : [days];
    return daysArr.map(d => dayMap[d] || d).join(', ');
};

const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate();
    return `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

async function loadData() {
    applicantList.innerHTML = '<tr><td colspan="9" class="text-center py-10 text-zinc-500"><div class="flex justify-center items-center gap-2"><svg class="animate-spin h-5 w-5 text-[#00D05A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>데이터를 불러오는 중입니다...</div></td></tr>';
    
    try {
        const q = query(collection(db, "applications"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        applicationsData = [];
        querySnapshot.forEach((doc) => {
            applicationsData.push({ id: doc.id, ...doc.data() });
        });

        renderTable();
    } catch (error) {
        console.error("데이터 로딩 에러:", error);
        applicantList.innerHTML = `<tr><td colspan="9" class="text-center py-10 text-red-500">데이터를 불러오는데 실패했습니다. Firestore 규칙이나 설정을 확인해주세요.<br><span class="text-sm opacity-70">${error.message}</span></td></tr>`;
    }
}

function renderTable() {
    totalCount.textContent = applicationsData.length;
    
    if (applicationsData.length === 0) {
        applicantList.innerHTML = '<tr><td colspan="9" class="text-center py-10 text-zinc-500">아직 지원자가 없습니다.</td></tr>';
        return;
    }

    applicantList.innerHTML = '';
    
    applicationsData.forEach((app, index) => {
        const tr = document.createElement('tr');
        
        const dateStr = formatDate(app.createdAt);
        const levelStr = levelMap[app.q6] || app.q6 || '-';
        const daysStr = formatDays(app.q11);
        
        tr.innerHTML = `
            <td class="text-zinc-400 whitespace-nowrap text-sm">${dateStr}</td>
            <td class="font-bold text-white">${app.name || '-'}</td>
            <td>${app.age || '-'}</td>
            <td class="max-w-[150px] truncate" title="${app.school || ''}">${app.school || '-'}</td>
            <td>${app.phone || '-'}</td>
            <td class="max-w-[150px] truncate" title="${app.location || ''}">${app.location || '-'}</td>
            <td><span class="badge">${levelStr}</span></td>
            <td>${daysStr}</td>
            <td class="sticky right-0 bg-[#111111] shadow-[-10px_0_10px_rgba(17,17,17,1)] text-center">
                <button class="bg-zinc-800 hover:bg-[#00D05A] hover:text-black text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors view-detail-btn whitespace-nowrap" data-index="${index}">
                    상세보기
                </button>
            </td>
        `;
        applicantList.appendChild(tr);
    });

    document.querySelectorAll('.view-detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            showModal(applicationsData[index]);
        });
    });
}

function showModal(app) {
    modalName.textContent = `- ${app.name}`;
    
    const timeMap = {
        "1": "평일 18시 이전", "2": "평일 18~20시", "3": "평일 20시 이후",
        "4": "주말 오전", "5": "주말 오후", "6": "주말 저녁"
    };
    
    const afterRunMap = {
        "1": "🍕 맛있는 거 먹기", "2": "☕ 카페 수다", "3": "🍻 가볍게 한잔",
        "4": "📸 러닝 인증샷", "5": "🏠 바로 집", "6": "🎲 멤버들이 정하는 대로"
    };

    const firstMeetingMap = {
        "1": "어색함 깨기 🧊", "2": "천천히 달려보기 🏃‍♂️🏃‍♀️", "3": "응원하며 완주 🙌",
        "4": "끝나고 같이 놀기 🗣️", "5": "새로운 코스 🗺️", "6": "새로운 경험 ✨"
    };

    const formatArr = (val, map) => {
        if (!val) return '-';
        const arr = Array.isArray(val) ? val : [val];
        return arr.map(v => map[v] || v).join(', ');
    };

    modalContent.innerHTML = `
        <div class="space-y-6 text-zinc-200">
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
                    <p class="text-xs text-zinc-500 mb-1">제출일시</p>
                    <p class="font-bold text-white">${formatDate(app.createdAt)}</p>
                </div>
                <div class="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
                    <p class="text-xs text-zinc-500 mb-1">기본정보</p>
                    <p class="font-bold text-white">${app.name} (${app.age}세) / ${app.phone}</p>
                </div>
            </div>

            <div>
                <h3 class="text-[#00D05A] font-bold mb-2 text-sm border-b border-zinc-800 pb-2">학교 및 지역</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                    <p class="text-sm"><span class="text-zinc-500 inline-block w-20">학교/학과:</span> <span class="text-white">${app.school || '-'}</span></p>
                    <p class="text-sm"><span class="text-zinc-500 inline-block w-20">거주지역:</span> <span class="text-white">${app.location || '-'}</span></p>
                </div>
            </div>

            <div>
                <h3 class="text-[#00D05A] font-bold mb-2 text-sm border-b border-zinc-800 pb-2">러닝 스타일</h3>
                <div class="space-y-2 mt-3">
                    <p class="text-sm"><span class="text-zinc-500 inline-block w-24">러닝 레벨:</span> <span class="bg-[#00D05A] text-black px-2 py-0.5 rounded-full text-xs font-bold">${levelMap[app.q6] || app.q6 || '-'}</span></p>
                    <p class="text-sm"><span class="text-zinc-500 inline-block w-24">러닝 후:</span> <span class="text-white">${formatArr(app.q9, afterRunMap)}</span></p>
                    <p class="text-sm"><span class="text-zinc-500 inline-block w-24">첫모임기대:</span> <span class="text-white">${formatArr(app.q10, firstMeetingMap)}</span></p>
                </div>
            </div>

            <div>
                <h3 class="text-[#00D05A] font-bold mb-2 text-sm border-b border-zinc-800 pb-2">일정</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                    <p class="text-sm"><span class="text-zinc-500 inline-block w-20">참여 요일:</span> <span class="text-white">${formatDays(app.q11)}</span></p>
                    <p class="text-sm"><span class="text-zinc-500 inline-block w-20">참여 시간:</span> <span class="text-white">${formatArr(app.q12, timeMap)}</span></p>
                </div>
            </div>

            <div class="space-y-5 pt-2">
                <div class="bg-[#18181b] p-4 rounded-xl border border-zinc-800">
                    <h3 class="text-[#00D05A] font-bold mb-2 text-sm">이루고 싶은 목표 🌱</h3>
                    <div class="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">${app.q7 || '-'}</div>
                </div>
                <div class="bg-[#18181b] p-4 rounded-xl border border-zinc-800">
                    <h3 class="text-[#00D05A] font-bold mb-2 text-sm">나를 다시 뛰게 만드는 원동력 🔥</h3>
                    <div class="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">${app.q8 || '-'}</div>
                </div>
                <div class="bg-[#18181b] p-4 rounded-xl border border-zinc-800">
                    <h3 class="text-[#00D05A] font-bold mb-2 text-sm">같이 해보고 싶은 활동 🤝</h3>
                    <div class="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">${app.q13 || '-'}</div>
                </div>
                <div class="bg-zinc-800/80 p-4 rounded-xl border border-zinc-700">
                    <h3 class="text-[#00D05A] font-bold mb-2 text-sm">지원 동기 ✍️</h3>
                    <div class="text-sm text-white font-medium whitespace-pre-wrap leading-relaxed">${app.q14 || '-'}</div>
                </div>
            </div>
        </div>
    `;
    
    detailModal.classList.remove('hidden');
}

closeModalBtn.addEventListener('click', () => {
    detailModal.classList.add('hidden');
});

detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) {
        detailModal.classList.add('hidden');
    }
});

refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('opacity-50', 'cursor-not-allowed');
    refreshBtn.innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>새로고침';
    
    loadData().finally(() => {
        setTimeout(() => {
            refreshBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            refreshBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>새로고침';
        }, 300);
    });
});

// Password Logic
const passwordOverlay = document.getElementById('password-overlay');
const passwordInput = document.getElementById('admin-password');
const passwordSubmit = document.getElementById('password-submit');
const passwordError = document.getElementById('password-error');

const ADMIN_PASSWORD = "00347";

function checkPassword() {
    if (passwordInput.value === ADMIN_PASSWORD) {
        document.body.classList.remove('overflow-hidden');
        passwordOverlay.classList.add('hidden');
        loadData();
    } else {
        passwordError.classList.remove('hidden');
        passwordInput.classList.add('border-red-500');
        passwordInput.value = '';
        setTimeout(() => {
            passwordError.classList.add('hidden');
            passwordInput.classList.remove('border-red-500');
        }, 2000);
    }
}

passwordSubmit.addEventListener('click', checkPassword);
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkPassword();
});
