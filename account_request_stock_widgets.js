(async () => {
    // Stock Widgets with Tabs!
    // Made by Lemuel Madridejos March 2, 2026

    window.show_tab = async (elem, div_id, toolbar_color) => {
        const tab = document.getElementById(div_id);

        document.querySelectorAll('#home_tab div[id]').forEach(item => {
            item.classList.remove('tab_open');
        });

        document.querySelectorAll('#home_tab button').forEach(item => {
            item.classList.remove('focused');
        });

        elem.classList.add('focused');
        tab.classList.add('tab_open');
        document.querySelector('#home_tab > div').className = `ui ${toolbar_color} message`;
    }

    // Listeners
    document.getElementById('btn_tab_lowstock').addEventListener('click', await loadStockRequests());
    document.getElementById('btn_tab_restock').addEventListener('click', await loadNews());

    // By default
    show_tab(document.getElementById('btn_tab_recent'), 'acc_req_parent', 'violet');

    async function loadStockRequests() {
        if (document.getElementById('acc_req_lowstock').children.length > 0)
            return;

        await initFunctions(['FirebaseModule', 'moment']);
        const parent = document.getElementById('acc_req_lowstock');
        let data = await FirebaseModule.fetchJSON('https://storehaccounts-website-default-rtdb.firebaseio.com/lowkeep.json');
        let keys = Object.keys(data);
        keys = keys.reverse();

        keys.forEach(key => {
            let item = data[key];
            parent.innerHTML += `<a href='${item.href}' style="                    
                        min-height: 50px;
                        border-bottom: 1px solid ${getRandomDarkColor()};
                        display: flex;
                        align-items: center;
                    "><img src="${item.img}" style="
                        max-height: 40px;
                        object-fit: cover;
                        margin: 5px;
                    "><div><span style="
                        background: ${getRandomDarkColor()};
                        color: white;
                        padding: 0 5px;
                        font-weight: 550;
                    ">${item.username}</span> has reported...<br><p style='line-height: 1.2rem;font-size: 0.9rem;'>Please notice <b>[${item.acc_name} v${item.accver}]</b> — <b>${item.stock} account${item.stock > 1 ? `s` : ``} left.</b></p></div><span style="margin-left: auto; padding: 0 5px; font-weight: 550; line-height: 1rem; font-size: 12px; opacity: 0.7;">${moment(parseInt(key)).fromNow()}</span></a>`;
        });

    }

    async function loadNews() {
        if (document.getElementById('acc_req_restock').children.length > 0)
            return;

        await initFunctions(['FirebaseModule', 'moment']);
        const parent = document.getElementById('acc_req_restock');
        let data = await FirebaseModule.fetchJSON('https://storehaccounts-website-default-rtdb.firebaseio.com/highkeep.json');
        let keys = Object.keys(data);
        keys = keys.reverse();

        keys.forEach(key => {
            let item = data[key];
            parent.innerHTML += `<div style="                    
                        min-height: 50px;
                        border-bottom: 1px solid ${getRandomDarkColor()};
                        display: flex;
                        align-items: center;
                    "><img src="${item.profile}" style="
                        max-height: 40px;
                        object-fit: cover;
                        margin: 5px;
                    "><div><b>ADMIN: </b><a href='https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${item.email}' style="
                        background: ${getRandomDarkColor()};
                        color: white;
                        padding: 0 5px;
                        font-weight: 550;
                    ">${item.email}</a><br><p style='line-height: 1.2rem;font-size: 0.9rem;'>${item.qty == 0 ? `Added a new Version!`: `New uploads: `}<b>[${item.acc} v${item.ver}]</b></br>— ${item.qty == 0 ? `New version opened: `: `Additional: `} <b>${item.qty} account${item.stock > 1 ? `s` : ``} more!</b></p></div><span style="margin-left: auto; padding: 0 5px; font-weight: 550; line-height: 1rem; font-size: 12px; opacity: 0.7;">${moment(parseInt(key)).fromNow()}</span></div>`;
        });
    }

    // MISC Functions
    function getRandomDarkColor() {
        const hue = Math.floor(Math.random() * 360); // any color
        const saturation = 60 + Math.random() * 30; // 60–90%
        const lightness = 20 + Math.random() * 25; // 20–45% (dark)

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
})();
