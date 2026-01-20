// Örnek Veri Seti (Gerçek projede bir JSON dosyasından veya API'den çekebilirsin)
const data = [
    { name: "Instagram", value: 650000000, img: "https://via.placeholder.com/800x1200?text=Instagram" },
    { name: "Cristiano Ronaldo", value: 600000000, img: "https://via.placeholder.com/800x1200?text=Ronaldo" },
    { name: "Lionel Messi", value: 480000000, img: "https://via.placeholder.com/800x1200?text=Messi" },
    { name: "YouTube", value: 2500000000, img: "https://via.placeholder.com/800x1200?text=YouTube" },
    { name: "Netflix", value: 238000000, img: "https://via.placeholder.com/800x1200?text=Netflix" }
];

let score = 0;
let leftItem, rightItem;
let availableItems = [...data];

function initGame() {
    score = 0;
    // İlk iki öğeyi seç
    leftItem = getRandomItem();
    rightItem = getRandomItem();
    updateUI();
}

function getRandomItem() {
    const index = Math.floor(Math.random() * availableItems.length);
    const item = availableItems[index];
    // Aynı öğenin tekrar gelmemesi için listeden çıkarabilirsin (opsiyonel)
    return item;
}

function updateUI() {
    // Sol Kart
    document.getElementById('left-name').innerText = leftItem.name;
    document.getElementById('left-value').innerText = leftItem.value.toLocaleString();
    document.getElementById('left-card').style.backgroundImage = `url('${leftItem.img}')`;

    // Sağ Kart
    document.getElementById('right-name').innerText = rightItem.name;
    document.getElementById('right-card').style.backgroundImage = `url('${rightItem.img}')`;
    
    // Kontrolleri göster, sağ değeri gizle
    document.getElementById('hl-controls').style.display = 'block';
    document.getElementById('right-value').style.display = 'none';
}

function makeGuess(choice) {
    const isHigher = rightItem.value >= leftItem.value;
    const isCorrect = (choice === 'higher' && isHigher) || (choice === 'lower' && !isHigher);

    // Sağdaki değeri göster
    const rightValEl = document.getElementById('right-value');
    rightValEl.innerText = rightItem.value.toLocaleString();
    rightValEl.style.display = 'block';
    document.getElementById('hl-controls').style.display = 'none';

    if (isCorrect) {
        score++;
        setTimeout(() => {
            // Sağdaki kart sola geçer, yeni bir sağ kart gelir
            leftItem = rightItem;
            rightItem = getRandomItem();
            
            // Eğer yeni sağ kart solla aynıysa tekrar seç
            while(rightItem === leftItem) {
                rightItem = getRandomItem();
            }
            updateUI();
        }, 1500); // 1.5 saniye sonra yeni soruya geç
    } else {
        alert("Kaybettin! Skorun: " + score);
        initGame(); // Oyunu sıfırla
    }
}

// Oyunu Başlat
initGame();
