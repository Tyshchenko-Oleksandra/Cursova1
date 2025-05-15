document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => window.scrollTo(0, 0), 10);
  const API_URL = "http://localhost:3000/api";
  let currentUser = null;

  // --- ПРИБРАНО автоматичне відновлення користувача ---
  // const savedUser = localStorage.getItem('currentUser');
  // if (savedUser) {
  //   try {
  //     currentUser = JSON.parse(savedUser);
  //     if (!currentUser.id) {
  //       currentUser = null;
  //     }
  //   } catch (e) {
  //     currentUser = null;
  //   }
  // }

  // --- Додаємо відображення кнопок/напису ---
  const authButtons = document.querySelector('.auth-buttons');
  function renderAuthBlock() {
    if (currentUser) {
      authButtons.innerHTML = `<span class="logged-in-msg">Ви уже увійшли в аккаунт</span>
        <button id="logoutBtn" style="margin-left:10px;">Вийти</button>`;
      document.getElementById('logoutBtn').onclick = function() {
        currentUser = null;
        localStorage.removeItem('currentUser');
        window.location.reload();
      };
    } else {
      authButtons.innerHTML = `
        <button>Увійти</button>
        <button>Зареєструватися</button>
      `;
      // Повторно підключаємо обробники для кнопок
      document.querySelector(".auth-buttons button:first-child").addEventListener("click", loginHandler);
      document.querySelector(".auth-buttons button:nth-child(2)").onclick = function() {
        document.getElementById('registerModal').classList.add('active');
      };
    }
  }

  // --- Функція для входу ---
  async function loginHandler() {
    const email = prompt("Введіть email:");
    const password = prompt("Введіть пароль:");
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (response.ok) {
        const data = await response.json();
        currentUser = { id: data.userId, email };
        alert("Ви успішно увійшли!");
        renderAuthBlock();
        loadVotings(); // <-- ОНОВЛЕНО: одразу оновлюємо таблицю
      } else {
        const error = await response.json();
        alert(`Помилка: ${error.message}`);
      }
    } catch (error) {
      console.error("Помилка автентифікації:", error);
    }
  }

  // --- Відразу рендеримо блок авторизації ---
  renderAuthBlock();

  // Елементи DOM
  const createVotingBtn = document.querySelector(".action-buttons button:first-child");
  const votingsTable = document.querySelector("tbody");

  // Зберігаємо всі голосування для доступу до кандидатів
  let allVotings = [];

  // Завантажити активні голосування при завантаженні сторінки
  loadVotings();

  // Кнопка "Створити нове голосування"
  createVotingBtn.addEventListener("click", () => {
    if (!currentUser) {
      alert("Увійдіть у систему, щоб створити голосування!");
      return;
    }
    createVoting();
  });


// Додаємо обробник для кнопки "Переглянути активні голосування"
document.getElementById('show-active').onclick = function() {
  // Знімаємо підсвічування з усіх рядків
  document.querySelectorAll("tbody tr").forEach(row => {
    row.classList.remove("highlight", "highlight-fade");
  });

  // Підсвічуємо лише активні голосування
  const highlightedRows = [];
  allVotings.forEach((voting, idx) => {
    if (voting.isActive) {
      const row = document.querySelectorAll("tbody tr")[idx];
      if (row) {
        row.classList.add("highlight");
        highlightedRows.push(row);
      }
    }
  });

  // Через 2 секунди запускаємо плавне зникнення
  setTimeout(() => {
    highlightedRows.forEach(row => row.classList.add("highlight-fade"));
    // Через 0.5 секунди прибираємо обидва класи
    setTimeout(() => {
      highlightedRows.forEach(row => row.classList.remove("highlight", "highlight-fade"));
    }, 500);
  }, 2000);
};

  // Функція для завантаження голосувань
  async function loadVotings() {
    try {
      const response = await fetch(`${API_URL}/voting/active`);
      const votings = await response.json();
      allVotings = votings; // Зберігаємо для подальшого використання
      renderVotings(votings);
    } catch (error) {
      console.error("Помилка завантаження голосувань:", error);
    }
  }

  // Відображення голосувань у таблиці
  function renderVotings(votings) {
    votingsTable.innerHTML = "";
    votings.forEach(voting => {
      // Додайте цей рядок для дебагу:
      console.log('ownerId:', voting.ownerId, 'currentUser.id:', currentUser?.id, 'eq:', String(voting.ownerId) === String(currentUser?.id));
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${voting.title}</td>
        <td colspan="2">
          <div class="voting-stats-row">
            <span>${voting.candidates.length} кандидатів</span>
            <span>${voting.totalVotes ?? 0} голосів</span>
          </div>
        </td>
        <td>
          <div class="voting-actions">
            <button class="vote-btn" data-id="${voting._id}" ${!voting.isActive ? 'disabled' : ''}>Проголосувати</button>
            <button class="add-candidate-btn" data-id="${voting._id}">Додати кандидата</button>
            ${String(voting.ownerId) === String(currentUser?.id) ? `
              <button class="start-voting-btn" data-id="${voting._id}" ${voting.isActive ? 'disabled' : ''}>Запустити</button>
              <button class="stop-voting-btn" data-id="${voting._id}" ${!voting.isActive ? 'disabled' : ''}>Зупинити</button>
              <button class="results-btn" data-id="${voting._id}">Результати</button>
            ` : ''}
          </div>
        </td>
      `;
      votingsTable.appendChild(row);
    });

    // Тільки для кнопок "Проголосувати"
    document.querySelectorAll(".vote-btn").forEach(btn => {
      btn.addEventListener("click", () => voteFor(btn.dataset.id));
    });

    // Тільки для кнопок "Додати кандидата"
    document.querySelectorAll(".add-candidate-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const name = prompt("Введіть імʼя кандидата:");
        if (name === null || name.trim() === "") return; // <-- ОНОВЛЕНО
        addCandidate(btn.dataset.id, name.trim());
      });
    });

    document.querySelectorAll(".start-voting-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        try {
          const response = await fetch(`${API_URL}/voting/${btn.dataset.id}/start`, { method: 'POST' });
          if (response.ok) {
            alert("Голосування запущено!");
            loadVotings();
          } else {
            const error = await response.json();
            alert("Помилка запуску: " + (error.message || "Невідома помилка"));
          }
        } catch (e) {
          alert("Помилка з'єднання з сервером");
        }
      });
    });

    document.querySelectorAll(".stop-voting-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        try {
          const response = await fetch(`${API_URL}/voting/${btn.dataset.id}/stop`, { method: 'POST' });
          if (response.ok) {
            alert("Голосування зупинено!");
            loadVotings();
          } else {
            const error = await response.json();
            alert("Помилка зупинки: " + (error.message || "Невідома помилка"));
          }
        } catch (e) {
          alert("Помилка з'єднання з сервером");
        }
      });
    });

    document.querySelectorAll(".results-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const voting = allVotings.find(v => v._id === btn.dataset.id);
        if (!voting) return;
        const results = voting.candidates
          .map(c => `${c.name}: ${c.votes || 0} голосів`)
          .join('\n');
        alert(`Результати:\n${results}`);
      });
    });
  }

  // Додаємо функцію для додавання кандидата

  async function addCandidate(votingId, candidateName) {

    const response = await fetch(`/api/voting/${votingId}/candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: candidateName })
    });
  
    if (!response.ok) {
      const error = await response.json();
      alert('Помилка: ' + error.error);
      return;
    }
  
    const candidate = await response.json();
    alert('Кандидата додано: ' + candidate.name);
    loadVotings(); // Додаємо оновлення списку голосувань
  }

  // Оновлена функція голосування
  async function voteFor(votingId) {
    if (!currentUser) {
      alert("Увійдіть у систему, щоб голосувати!");
      return;
    }
    const voting = allVotings.find(v => v._id === votingId);
    if (!voting) {
      alert("Голосування не знайдено");
      return;
    }
    if (!voting.isActive) {
      alert("Голосування ще не запущено!");
      return;
    }
    // Якщо кандидатів немає — повідомлення
    if (!voting.candidates || voting.candidates.length === 0) {
      alert("У цьому голосуванні ще немає жодного кандидата.");
      return;
    }
    // Формуємо список кандидатів з номерами
    const candidatesList = voting.candidates
      .map((c, idx) => `${idx + 1}. ${c.name}`)
      .join('\n');
    const input = prompt(`Оберіть кандидата, ввівши номер:\n${candidatesList}`);
    if (!input) return;
    const num = parseInt(input, 10);
    if (isNaN(num) || num < 1 || num > voting.candidates.length) {
      alert("Некоректний номер кандидата");
      return;
    }
    const candidate = voting.candidates[num - 1];
    // Відправляємо голос
    try {
      const response = await fetch(`${API_URL}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          votingId: voting._id,
          candidateId: candidate._id
        })
      });
      const result = await response.json();
      if (!response.ok) {
        alert(result.message || "Ви уже пройшли голосування!");
        return;
      }
      alert("Ваш голос зараховано!");
      loadVotings();
    } catch (error) {
      alert("Помилка голосування");
    }
  }

  // Функція створення нового голосування (спрощений варіант)
  async function createVoting() {
    const title = prompt("Введіть назву голосування:");
    if (!title) return;

    try {
      const response = await fetch(`${API_URL}/voting/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          ownerId: currentUser.id
        })
      });

      if (response.ok) {
        alert("Голосування створено!");
        loadVotings();
      } else {
        const error = await response.json();
        alert(`Помилка: ${error.message}`);
      }
    } catch (error) {
      console.error("Помилка створення голосування:", error);
    }
  }


  // Відкрити модальне вікно
  document.querySelector('.auth-buttons button:nth-child(2)').onclick = function() {
    document.getElementById('registerModal').classList.add('active');
  };

  // Закрити модальне вікно
  function closeRegisterModal() {
    document.getElementById('registerModal').classList.remove('active');
    document.getElementById('registerError').textContent = '';
  }

  // Додаємо обробник для кнопки "Зареєструватися"
document.querySelector('.auth-buttons button:nth-child(2)').onclick = function() {
  document.getElementById('registerModal').classList.add('active');
};

function closeRegisterModal() {
  document.getElementById('registerModal').classList.remove('active');
  document.getElementById('registerError').textContent = '';
}

// Відправка даних на бекенд
async function registerUser() {
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const errorDiv = document.getElementById('registerError');
  errorDiv.textContent = '';

  if (!email || !password) {
    errorDiv.textContent = 'Введіть email і пароль!';
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      closeRegisterModal();
      alert('Реєстрація успішна!');
    } else {
      errorDiv.textContent = data.error || 'Помилка реєстрації';
    }
  } catch (e) {
    errorDiv.textContent = 'Помилка зʼєднання з сервером';
  }
}

document.getElementById('registerBtn').addEventListener('click', registerUser);
document.getElementById('closeRegisterModalBtn').addEventListener('click', closeRegisterModal);
});