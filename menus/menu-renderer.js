// Render menu items in sidebar
function renderMenuItems() {
  const sidebarNav = document.querySelector('.sidebar-nav');
  
  menuItems.forEach((item, index) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';
    a.id = item.id;
    a.textContent = `${item.emoji} ${item.label}`;
    a.onclick = (e) => {
      e.preventDefault();
      loadCategory(item.category);
    };
    
    if (index === 0) {
      a.classList.add('active');
    }
    
    li.appendChild(a);
    sidebarNav.appendChild(li);
  });
}