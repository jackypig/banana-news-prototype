const wordPool = [
    { scrambled: "N A B A N A", clean: "BANANA" },
    { scrambled: "E C I L C O N H R", clean: "CHRONICLE" },
    { scrambled: "W E N S P A P E R", clean: "NEWSPAPER" },
    { scrambled: "E D I T O R I A L", clean: "EDITORIAL" },
    { scrambled: "S U B M E R S I B L E", clean: "SUBMERSIBLE" }
];

let selectedPuzzle = wordPool[0];

const sudokuPuzzles = [
    [   // Puzzle A — classic Wikipedia example
        5,3,0, 0,7,0, 0,0,0,
        6,0,0, 1,9,5, 0,0,0,
        0,9,8, 0,0,0, 0,6,0,
        8,0,0, 0,6,0, 0,0,3,
        4,0,0, 8,0,3, 0,0,1,
        7,0,0, 0,2,0, 0,0,6,
        0,6,0, 0,0,0, 2,8,0,
        0,0,0, 4,1,9, 0,0,5,
        0,0,0, 0,8,0, 0,7,9
    ],
    [   // Puzzle B — symmetric easy
        0,0,3, 0,2,0, 6,0,0,
        9,0,0, 3,0,5, 0,0,1,
        0,0,1, 8,0,6, 4,0,0,
        0,0,8, 1,0,2, 9,0,0,
        7,0,0, 0,0,0, 0,0,8,
        0,0,6, 7,0,8, 2,0,0,
        0,0,2, 6,0,9, 5,0,0,
        8,0,0, 2,0,3, 0,0,9,
        0,0,5, 0,1,0, 3,0,0
    ],
    [   // Puzzle C
        0,0,0, 2,6,0, 7,0,1,
        6,8,0, 0,7,0, 0,9,0,
        1,9,0, 0,0,4, 5,0,0,
        8,2,0, 1,0,0, 0,4,0,
        0,0,4, 6,0,2, 9,0,0,
        0,5,0, 0,0,3, 0,2,8,
        0,0,9, 3,0,0, 0,7,4,
        0,4,0, 0,5,0, 0,3,6,
        7,0,3, 0,1,8, 0,0,0
    ]
];

const sudokuSolutions = [
    [5,3,4,6,7,8,9,1,2, 6,7,2,1,9,5,3,4,8, 1,9,8,3,4,2,5,6,7, 8,5,9,7,6,1,4,2,3, 4,2,6,8,5,3,7,9,1, 7,1,3,9,2,4,8,5,6, 9,6,1,5,3,7,2,8,4, 2,8,7,4,1,9,6,3,5, 3,4,5,2,8,6,1,7,9],
    [4,8,3,9,2,1,6,5,7, 9,6,7,3,4,5,8,2,1, 2,5,1,8,7,6,4,9,3, 5,4,8,1,3,2,9,7,6, 7,2,9,5,6,4,1,3,8, 1,3,6,7,9,8,2,4,5, 3,7,2,6,8,9,5,1,4, 8,1,4,2,5,3,7,6,9, 6,9,5,4,1,7,3,8,2],
    [4,3,5,2,6,9,7,8,1, 6,8,2,5,7,1,4,9,3, 1,9,7,8,3,4,5,6,2, 8,2,6,1,9,5,3,4,7, 3,7,4,6,8,2,9,1,5, 9,5,1,7,4,3,6,2,8, 5,1,9,3,2,6,8,7,4, 2,4,8,9,5,7,1,3,6, 7,6,3,4,1,8,2,5,9]
];

let activeSudokuPuzzle = null;
let activeSudokuSolution = null;

function renderSudoku(puzzle) {
    activeSudokuPuzzle = puzzle;
    const grid = document.getElementById("sudoku-grid");
    if (!grid) return;
    grid.innerHTML = "";
    puzzle.forEach((val, i) => {
        const cell = document.createElement("input");
        cell.type = "text";
        cell.maxLength = 1;
        cell.className = "sudoku-cell" + (val !== 0 ? " given" : "");
        cell.value = val !== 0 ? val : "";
        cell.readOnly = val !== 0;
        cell.dataset.index = i;
        if (val === 0) {
            cell.addEventListener("input", function() {
                this.value = this.value.replace(/[^1-9]/g, "").slice(-1);
                this.classList.remove("correct", "wrong");
                document.getElementById("sudoku-feedback").textContent = "";
            });
        }
        grid.appendChild(cell);
    });
    document.getElementById("sudoku-feedback").textContent = "";
}

function newSudoku() {
    const idx = Math.floor(Math.random() * sudokuPuzzles.length);
    activeSudokuSolution = sudokuSolutions[idx];
    renderSudoku(sudokuPuzzles[idx]);
}

function checkSudoku() {
    const grid = document.getElementById("sudoku-grid");
    if (!grid) return;
    const cells = grid.querySelectorAll(".sudoku-cell");
    let allFilled = true;
    let allCorrect = true;
    cells.forEach((cell, i) => {
        if (cell.readOnly) return;
        const val = parseInt(cell.value);
        if (!cell.value) { allFilled = false; return; }
        if (val === activeSudokuSolution[i]) {
            cell.classList.add("correct");
            cell.classList.remove("wrong");
        } else {
            cell.classList.add("wrong");
            cell.classList.remove("correct");
            allCorrect = false;
        }
    });
    const fb = document.getElementById("sudoku-feedback");
    if (!allFilled) {
        fb.style.color = "#666"; fb.textContent = "Fill in all cells to complete.";
    } else if (allCorrect) {
        fb.style.color = "#00cc66"; fb.textContent = "✓ Solved! Editorial board congratulates you.";
    } else {
        fb.style.color = "#ff4444"; fb.textContent = "✗ Some cells are incorrect — keep trying.";
    }
}

function initializePuzzle() {
    selectedPuzzle = wordPool[Math.floor(Math.random() * wordPool.length)];
    const container = document.getElementById("jumble-container");
    if (container) {
        container.innerText = selectedPuzzle.scrambled;
    }
}

function checkPuzzleAnswer() {
    const userGuess = document.getElementById("puzzle-input").value.trim().toUpperCase();
    const feedbackBox = document.getElementById("puzzle-feedback");

    if (userGuess === selectedPuzzle.clean) {
        feedbackBox.style.color = "#00cc66";
        feedbackBox.innerText = "✓ Correct! Editorial staff commends you.";

        setTimeout(() => {
            initializePuzzle();
            document.getElementById("puzzle-input").value = "";
            feedbackBox.innerText = "";
        }, 3000);
    } else {
        feedbackBox.style.color = "#ff4444";
        feedbackBox.innerText = "✗ Incorrect. Check spelling and retry.";
    }
}
