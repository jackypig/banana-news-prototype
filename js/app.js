const sectionCache = {};

const sectionTitles = {
    front: "Front Page Edition",
    banana: "The Banana Desk — Special Report",
    marine: "Marine & Culinary Desk",
    tundra: "Tundra & Wildlife Desk",
    tech: "Tech & Cyber Watch",
    world: "World & Global Affairs",
    local: "Local & Business Economy",
    science: "The Science Desk",
    fashion: "Fashion, Style & Lifestyle",
    worldcup: "World Cup 2026 — Match Centre",
    puzzles: "The Puzzles & Leisure Desk"
};

function toggleSidebar(open) {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    if (open) {
        sidebar.classList.add("open");
        overlay.classList.add("active");
    } else {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
    }
}

function quickSelectTile(categoryKey, storyId) {
    const tiles = document.querySelectorAll(".tile-card");
    tiles.forEach(t => t.classList.remove("active"));

    loadCategory(categoryKey, true);

    let activeTileId = "tile-front";
    if (storyId === "tundra_polar") activeTileId = "tile-polar";
    else if (storyId === "keyboard_main") activeTileId = "tile-keyboard";
    else if (storyId === "sarcasm_plants") activeTileId = "tile-sarcasm";
    else if (storyId === "dolphin_main") activeTileId = "tile-dolphin";
    else if (storyId === "marine_main") activeTileId = "tile-marine";
    else if (storyId === "furniture_geddon") activeTileId = "tile-banana";
    else if (storyId === "worldcup_main") activeTileId = "tile-worldcup";

    const activeTile = document.getElementById(activeTileId);
    if (activeTile) activeTile.classList.add("active");
}

async function loadCategory(categoryKey, preventScroll = false) {
    const links = document.querySelectorAll(".sidebar-nav a");
    links.forEach(link => link.classList.remove("active"));

    const activeLink = document.getElementById(`nav-${categoryKey}`);
    if (activeLink) activeLink.classList.add("active");

    const headerDisplay = document.getElementById("section-header-display");
    headerDisplay.innerText = sectionTitles[categoryKey] || "Editorial Desks";

    if (!sectionCache[categoryKey]) {
        try {
            const resp = await fetch(`sections/${categoryKey}/data.json`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            sectionCache[categoryKey] = await resp.json();
        } catch (e) {
            console.error(`Failed to load section: ${categoryKey}`, e);
            document.getElementById("main-content-grid").innerHTML =
                `<p style="padding:20px;color:#990000;font-family:sans-serif;">Section unavailable. Please try again.</p>`;
            return;
        }
    }
    const data = sectionCache[categoryKey];

    toggleSidebar(false);

    // Construct Column 1 (Left Column)
    let leftColHTML = "";
    data.left.forEach((story, idx) => {
        leftColHTML += `
            <span class="story-tag ui-label">${story.tag}</span>
            <h3 class="sub-title"><a onclick="openArticle(${JSON.stringify(story).replace(/"/g, '&quot;')})">${story.title}</a></h3>
            <p class="snippet">${story.snippet}</p>
            <p class="author ui-label">By ${story.author}</p>
        `;
        if (idx < data.left.length - 1) {
            leftColHTML += `<div class="divider-line"></div>`;
        }
    });

    // Construct Column 2 (Main Lead Story Column)
    const lead = data.main;
    const mainColHTML = `
        <span class="story-tag ui-label" style="font-size: 0.9rem; font-weight: bold;">${lead.tag}</span>
        <h2 class="main-title"><a onclick="openArticle(${JSON.stringify(lead).replace(/"/g, '&quot;')})">${lead.title}</a></h2>

        <div class="news-img-box">
            <img src="${lead.image || ''}" alt="${lead.imageAlt || ''}" onerror="this.onerror=null; this.src='${lead.fallbackImage || ''}';">
        </div>

        <p class="snippet"><strong>SUMMARY —</strong> ${lead.snippet}</p>
        <p class="author ui-label">By ${lead.author}</p>
        <button class="ui-label" style="background: none; border: 1px solid #111; padding: 6px 12px; margin-top: 10px; cursor: pointer; font-weight: bold; font-size: 0.75rem;" onclick="openArticle(${JSON.stringify(lead).replace(/"/g, '&quot;')})">Read Full Chronicle</button>
    `;

    // Construct Column 3 (Right Column: Puzzle & Features)
    let rightColHTML = "";
    if (data.right.hasPuzzle) {
        rightColHTML += `
            <div class="puzzle-box" style="margin-bottom: 20px;">
                <span class="story-tag ui-label">The Daily Sudoku</span>
                <h3 class="ui-label" style="font-family: sans-serif; font-size: 1rem; border-bottom: 2px solid #111; padding-bottom: 4px; margin-bottom: 12px;">Sudoku — Easy</h3>
                <div class="sudoku-grid" id="sudoku-grid"></div>
                <div class="sudoku-buttons">
                    <button type="button" class="ui-label" onclick="checkSudoku()">Check</button>
                    <button type="button" class="ui-label" onclick="newSudoku()">New Puzzle</button>
                </div>
                <div id="sudoku-feedback"></div>
            </div>
            <div class="divider-line"></div>
            <div class="puzzle-box">
                <span class="story-tag ui-label">The Daily Mind-Bender</span>
                <h3 class="ui-label" style="font-family: sans-serif; font-size: 1rem; border-bottom: 2px solid #111; padding-bottom: 4px; margin-bottom: 12px;">Word Jumble</h3>
                <p style="font-size: 0.9rem; margin-bottom: 12px; font-family: sans-serif;">Unscramble the media-related word below:</p>

                <div class="scrambled-word" id="jumble-container">${selectedPuzzle.scrambled}</div>

                <input type="text" id="puzzle-input" class="ui-label" placeholder="Type your guess here..." autocomplete="off">
                <button type="button" class="ui-label" onclick="checkPuzzleAnswer()">Submit Guess</button>

                <div id="puzzle-feedback"></div>
            </div>
        `;
    }

    if (data.right.inlineHTML) {
        rightColHTML += data.right.inlineHTML;
    }

    if (data.right.extraStory) {
        if (data.right.hasPuzzle || data.right.inlineHTML) {
            rightColHTML += `<div class="divider-line"></div>`;
        }
        const extra = data.right.extraStory;
        rightColHTML += `
            <span class="story-tag ui-label">${extra.tag}</span>
            <h3 class="sub-title"><a onclick="openArticle(${JSON.stringify(extra).replace(/"/g, '&quot;')})">${extra.title}</a></h3>
            <p class="snippet">${extra.snippet}</p>
        `;
    }

    document.getElementById("main-content-grid").innerHTML = `
        <aside class="col-left">${leftColHTML}</aside>
        <section class="col-main">${mainColHTML}</section>
        <aside class="col-right">${rightColHTML}</aside>
    `;

    if (data.right.hasPuzzle) {
        newSudoku();
    }

    if (!preventScroll) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function openArticle(story) {
    const modal = document.getElementById("article-modal");
    const modalBody = document.getElementById("modal-article-body");

    let imageMarkup = "";
    if (story.image) {
        imageMarkup = `<img src="${story.image}" class="modal-img" onerror="this.onerror=null; this.src='${story.fallbackImage || 'https://images.unsplash.com/photo-1546074177-ffedd1d85d4b?auto=format&fit=crop&w=800&q=80'}';" alt="Lead Graphic">`;
    }

    modalBody.innerHTML = `
        <span class="story-tag ui-label">${story.tag || "Newsroom Special"}</span>
        <h2>${story.title}</h2>
        <div class="modal-meta ui-label">
            <span>By ${story.author || "Staff Writer"}</span>
            <span>MD Chronicle Archives</span>
        </div>
        ${imageMarkup}
        <div class="modal-text">
            ${story.content}
        </div>
    `;
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeArticle() {
    const modal = document.getElementById("article-modal");
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
}

function closeModalOnOuterClick(event) {
    if (event.target.id === "article-modal") {
        closeArticle();
    }
}

window.onload = function() {
    loadCategory('front');
    initializePuzzle();
};
