
let names = [];
let isRunning = false;
let pickedNames = [];
let isCardEffect = true;

let isAudioEnabled = true; // 默认开启音效

function resetPickedNames() {
    pickedNames = JSON.parse(localStorage.getItem('pickedNames')) || [];
    localStorage.setItem('pickedNames', '[]');
    alert('已清空历史点名记录：'+ pickedNames.length + '条\n' + '历史名单：' + pickedNames.join(', '));
}

function toggleAudio() {
    isAudioEnabled = !isAudioEnabled;
    const audioSwitch = document.getElementById('audioSwitch');
    audioSwitch.textContent = isAudioEnabled ? (isEnglish ? 'Mute' : '关闭音效') : (isEnglish ? 'Unmute' : '开启音效');
}

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const excelNames = XLSX.utils.sheet_to_json(worksheet, {header: 1}).flat().filter(Boolean);
        
        // 生成并下载 JavaScript 文件
        const jsContent = `const classNames = ${JSON.stringify(excelNames)};`;
        const blob = new Blob([jsContent], {type: 'application/javascript'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'class_names.js';
        link.click();
        URL.revokeObjectURL(link.href);

        alert('已生成 class_names.js 文件。请将此文件放入与 HTML 文件相同的文件夹中，然后刷新页面。');

        document.getElementById('uploadBtn').textContent = "重新上传班级名单";
    };
    reader.readAsArrayBuffer(file);
}

function updateClassInfo() {
    const classInfo = document.getElementById('classInfo');
    const lang = isEnglish ? 'en' : 'zh';
    classInfo.textContent = translations[lang]['classInfo'].replace('{0}', names.length);
    classInfo.style.display = names.length > 0 ? 'block' : 'none';
}

function updateNameGrid() {
    const nameGrid = document.getElementById('nameGrid');
    nameGrid.innerHTML = names.map(name => `<div class="name-item"><span>${name}</span></div>`).join('');
}

function toggleEffect() {
    isCardEffect = !isCardEffect;
    const toggleButton = document.getElementById('toggleButton');
    const nameGrid = document.getElementById('nameGrid');
    const cardContainer = document.getElementById('cardContainer');
    
    updateToggleButtonText(); // 新增这行
    
    if (isCardEffect) {
        nameGrid.style.display = 'none';
        cardContainer.style.display = 'block';
        updateCardNames(); // 更新卡片上的名字
    } else {
        nameGrid.style.display = 'grid';
        cardContainer.style.display = 'none';
        updateNameGrid(); // 更新名字列表
    }
}

// 新增这个函数
function updateToggleButtonText() {
    const toggleButton = document.getElementById('toggleButton');
    const lang = isEnglish ? 'en' : 'zh';
    toggleButton.textContent = isCardEffect ? translations[lang]['toggleEffectCard'] : translations[lang]['toggleEffect'];
}

function updateCardNames() {
    const cardWrapper = document.querySelector('.card-wrapper');
    cardWrapper.innerHTML = '';
    const totalCards = names.length + 4; // 额外添加一些卡片以确保滑动效果流畅
    const lang = isEnglish ? 'en' : 'zh';

    for (let i = 0; i < totalCards; i++) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-result ${isEnglish ? 'english-font' : ''}">${translations[lang]['resultTitle']}</div>
            <span class="card-name" style="font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;">${names[i % names.length]}</span>
        `;
        cardWrapper.appendChild(card);
    }
}

function startRandomPick() {
    if (names.length < 2 || isRunning) {
        return;
    }
    
    isRunning = true;
    const startButton = document.getElementById('startButton');
    startButton.disabled = true;
    
    // const animationDuration = 1500; // 设置动画持续时间
    
    if (isCardEffect) {
        playPickSound('card');
        resetCardEffect();
        startCardEffect(1200);
    } else {
        playPickSound('marquee');
        startMarqueeEffect(1500);
    }
}

function startMarqueeEffect(duration) {
    const nameItems = document.querySelectorAll('.name-item');
    nameItems.forEach(item => item.classList.remove('highlight'));
    
    let highlightIndex = 0;
    const intervalId = setInterval(() => {
        nameItems[highlightIndex].classList.remove('highlight');
        highlightIndex = Math.floor(Math.random() * nameItems.length);
        nameItems[highlightIndex].classList.add('highlight');
    }, 100);
    
    setTimeout(() => {
        clearInterval(intervalId);
        finishRandomPick(nameItems);
    }, duration);
}

function startCardEffect(duration) {
    const selectedName = getRandomName(); // 先选择一个人
    const cardWrapper = document.querySelector('.card-wrapper');
    const cards = cardWrapper.querySelectorAll('.card');
    const totalCards = cards.length;
    const centerIndex = Math.floor(totalCards / 2);
    const lang = isEnglish ? 'en' : 'zh';
    
    // 重新排列卡片，使选中的名字在中间
    const newOrder = [];
    for (let i = 0; i < totalCards; i++) {
        const index = (centerIndex - i + totalCards) % totalCards;
        newOrder.push(names[(names.indexOf(selectedName) - index + names.length) % names.length]);
    }
    
    cards.forEach((card, index) => {
        card.querySelector('.card-name').textContent = newOrder[index];
        const cardResult = card.querySelector('.card-result');
        cardResult.textContent = translations[lang]['resultTitle'];
        cardResult.classList.toggle('english-font', isEnglish);
        card.style.transform = `translateX(${(index - centerIndex) * 190}px)`;
        card.style.opacity = 1;
        card.style.filter = 'blur(0px)';
    });

    const totalSlide = (centerIndex - 1) * 190;

    cardWrapper.style.transition = 'none';
    cardWrapper.style.left = '0px';
    
    setTimeout(() => {
        cardWrapper.style.transition = `left ${duration/1000}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
        cardWrapper.style.left = `-${totalSlide}px`;
        cards.forEach((card, index) => {
            card.style.transition = `all ${duration/1000}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
            card.style.transform = 'translateX(0)';
        });
    }, 50);

    setTimeout(() => {
        finishRandomPick(selectedName);
    }, duration);
}

function finishRandomPick(selectedNameOrItems) {
    const startButton = document.getElementById('startButton');
    
    if (isCardEffect) {
        // 卡片模式的逻辑保持不变
        const cards = document.querySelectorAll('.card');
        const centerCard = cards[Math.floor(cards.length / 2)];
        cards.forEach(card => {
            card.classList.remove('selected');
            card.style.transition = 'all 0.5s ease';
            card.style.filter = 'blur(1px)';
            card.style.opacity = '0.8';
        });
        centerCard.classList.add('selected');
        centerCard.style.filter = 'blur(0px)';
        centerCard.style.opacity = '1';
        centerCard.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            centerCard.querySelector('.card-result').style.opacity = '1';
            centerCard.querySelector('.card-name').style.color = '#e74c3c';
        }, 500);

        // 确保选中的卡片在视图中央
        const cardContainer = document.querySelector('.card-container');
        const cardRect = centerCard.getBoundingClientRect();
        const containerRect = cardContainer.getBoundingClientRect();
        const offset = cardRect.left - containerRect.left - (containerRect.width - cardRect.width) / 2;
        const cardWrapper = document.querySelector('.card-wrapper');
        cardWrapper.style.transition = 'left 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)';
        cardWrapper.style.left = `${cardWrapper.offsetLeft - offset}px`;
    } else {
        // 跑马灯模式的逻辑
        const overlay = document.getElementById('overlay');
        const selectedNameElement = document.getElementById('selectedName');
        const nameItems = document.querySelectorAll('.name-item');
        let selectedName = '';

        nameItems.forEach(item => {
            item.classList.remove('highlight');
            if (item.classList.contains('highlight')) {
                selectedName = item.textContent;
            }
        });

        // 如果没有找到高亮的元素，就随机选择一个
        if (!selectedName) {
            selectedName = getRandomName();
        }

        // 高亮显示选中的名字
        nameItems.forEach(item => {
            if (item.textContent === selectedName) {
                item.classList.add('highlight');
            }
        });

        selectedNameElement.textContent = selectedName;
        overlay.classList.add('show');
    }
    
    startButton.disabled = false;
    isRunning = false;
}

function getRandomName() {
    // 从localStorage获取已点名学生列表
    pickedNames = JSON.parse(localStorage.getItem('pickedNames')) || [];
    
    // 如果所有学生都被点过，重置列表
    if (pickedNames.length >= names.length) {
        pickedNames = [];
    }
    
    // 筛选出未被点到的学生
    const availableNames = names.filter(name => !pickedNames.includes(name));
    
    // 随机选择一个未被点到的学生
    const selectedName = availableNames[Math.floor(Math.random() * availableNames.length)];
    
    // 选中的学生添加到已点名列表
    pickedNames.push(selectedName);
    
    // 更新localStorage
    localStorage.setItem('pickedNames', JSON.stringify(pickedNames));
    
    return selectedName;
}

function closeOverlay() {
    document.getElementById('overlay').classList.remove('show');
}

function resetCardEffect() {
    const cardWrapper = document.querySelector('.card-wrapper');
    cardWrapper.style.transition = 'none';
    cardWrapper.style.left = '0px';
    const cards = cardWrapper.querySelectorAll('.card');
    cards.forEach(card => {
        card.classList.remove('selected');
        card.querySelector('.card-result').style.opacity = '0';
        card.querySelector('.card-name').style.color = '';
    });
}

// 添加语言切换功能
let isEnglish = false;
const translations = {
    'zh': {
        'title': '随机点名',
        'toggleEffect': '切换为卡牌效果',
        'toggleEffectCard': '切换为跑马灯效果',
        'uploadBtn': '请上传班级名单',
        'uploadBtnAgain': '重新上传班级名单',
        'startButton': '开始点名',
        'resultTitle': '就是你了！',
        'classInfo': '当前班级：共{0}人',
        'languageSwitch': 'English',
        'closeButton': '关闭',
        'footerinfo': 'Modified by MeTerminator & Sponsored by whoopi',
        'muteAudio': '关闭音效',
        'unmuteAudio': '开启音',
        'resetBtn': '重置点名记录'
    },
    'en': {
        'title': 'Random Name Picker',
        'toggleEffect': 'Switch to Card Effect',
        'toggleEffectCard': 'Switch to Marquee Effect',
        'uploadBtn': 'Upload Class List',
        'uploadBtnAgain': 'Re-upload Class List',
        'startButton': 'Start Picking',
        'resultTitle': "It's You!",
        'classInfo': 'Current Class: {0} students in total',
        'languageSwitch': '中文',
        'closeButton': 'Close',
        'footerinfo': 'Modified by MeTerminator & Sponsored by whoopi',
        'muteAudio': 'Mute',
        'unmuteAudio': 'Unmute',
        'resetBtn': 'Reset Picking Record'
    }
};

function toggleLanguage() {
    isEnglish = !isEnglish;
    const lang = isEnglish ? 'en' : 'zh';
    document.documentElement.lang = lang;
    document.body.style.fontFamily = isEnglish ? "'Montserrat', sans-serif" : "'KaiTi', '楷体', 'STKaiti', 'Roboto', 'Noto Sans SC', sans-serif";
    
    // 更新名字的字体
    const nameItems = document.querySelectorAll('.name-item');
    nameItems.forEach(item => {
        item.style.fontFamily = "'Microsoft YaHei', '微软雅黑', sans-serif";
    });
    
    updateTexts();
    updateCardNames();
}

function updateTexts() {
    const lang = isEnglish ? 'en' : 'zh';
    document.title = translations[lang]['title'];
    
    const elements = [
        { selector: 'h1', key: 'title' },
        { selector: '#uploadBtn', key: names.length > 0 ? 'uploadBtnAgain' : 'uploadBtn' },
        { selector: '#startButton', key: 'startButton' },
        { selector: '#resetBtn', key: 'resetBtn' },
        { selector: '.result-message h2', key: 'resultTitle' },
        { selector: '#languageSwitch', key: 'languageSwitch' },
        { selector: '#audioSwitch', key: isAudioEnabled ? 'muteAudio' : 'unmuteAudio' },
        { selector: '.close-button', key: 'closeButton' },
        { selector: '.footerinfo', key: 'footerinfo' }
    ];

    elements.forEach(el => {
        const element = document.querySelector(el.selector);
        if (element) {
            element.textContent = translations[lang][el.key];
            element.classList.toggle('english-font', isEnglish);
        }
    });

    updateToggleButtonText();
    updateClassInfo();
}

function playPickSound(mode) {
    if (!isAudioEnabled) return; // 如果音效关闭,直接返回
    const audio = document.getElementById(mode === 'card' ? 'cardSound' : 'marqueeSound');
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log("播放音频失败:", e));
    } else {
        console.log("未找到音频元素");
    }
}

// 修改 window.onload 函数
window.onload = function() {
    document.getElementById('startButton').disabled = true;
    document.getElementById('classInfo').style.display = 'none';

    // 尝试加载 class_names.js 文件
    const script = document.createElement('script');
    script.src = 'class_names.js';
    script.onload = function() {
        if (typeof classNames !== 'undefined') {
            names = classNames;
            // 初始化卡片容器
            updateCardNames();
            updateClassInfo();
            document.getElementById('startButton').disabled = false;
            // document.getElementById('uploadBtn').textContent = translations[isEnglish ? 'en' : 'zh']['uploadBtnAgain'];
        }
    };
    // script.onerror = function() {
    //     document.getElementById('uploadBtn').textContent = translations[isEnglish ? 'en' : 'zh']['uploadBtn'];
    // };
    document.head.appendChild(script);

    // 从localStorage加载已点名学生列表
    pickedNames = JSON.parse(localStorage.getItem('pickedNames')) || [];

    updateNameGrid();

    updateCardNames();

    // 初始化语言
    updateTexts();

}

// 自动关闭失焦 Tab
// 创建一个 BroadcastChannel
const channel = new BroadcastChannel('active_tab_channel');
// 当前 Tab 的唯一 ID
const tabId = Date.now().toString();
// 用于存储活跃的 Tab ID
let activeTabId = tabId;

// 当窗口获得焦点时，广播当前 Tab ID 为活跃的
window.onfocus = () => {
    activeTabId = tabId;
    channel.postMessage({ activeTabId });
};

// 当接收到消息时，如果当前 Tab 不是活跃的，则关闭
channel.onmessage = (event) => {
    const { activeTabId: receivedActiveTabId } = event.data;
    if (receivedActiveTabId !== tabId) {
        // 如果当前 Tab 不是活跃的，就关闭它
        window.close();
    }
};

// 初始化时，标记当前 Tab 为活跃
channel.postMessage({ activeTabId });