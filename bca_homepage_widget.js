
// Made with love with the Help of God, ina and ama.
// July 17, 2026
// Made only in half day.


(async () => {
    // CORE
    await initFunctions(['BCA_Url']);
    if (BCA_Url.getPathname() !== '/' || !document.querySelector('.bca_widgets_home-container'))
        return;

    async function power_up_tabs() {
        const tab_btns = document.querySelectorAll('.bca_widgets_home-tabs button');
        let isLoaded = [false, false, false, false];
        Array.from(tab_btns).forEach(item => {
            item.addEventListener('click', async (e) => {
                let btn = e.currentTarget;
                let target = btn.dataset.target;

                // Foreground
                deativate_all_tabs();
                hide_all_tab_contents();

                btn.classList.add('bca_widgets_home-tab-btn--active');
                document.getElementById(target).style.display = 'block';

                // Backend
                if (target.includes('comments') && !isLoaded[1]) {
                    await loadLatestComments();
                    isLoaded[1] = true;
                    return;
                }
                if (target.includes('members') && !isLoaded[2]) {
                    await loadLatestMembers();
                    isLoaded[2] = true;
                    return;
                }
                if (target.includes('tickets') && !isLoaded[3]) {
                    await loadLatestTickets();
                    isLoaded[3] = true;
                    return;
                }
            })
        });

        // by default initialize the first tab
        await latestModsWidget();
        isLoaded[0] = true;
    }

    // MISC Functions
    function hide_all_tab_contents() {
        let tab_contents = document.querySelectorAll('.bca_widgets_home-content-list');
        Array.from(tab_contents).forEach(item => item.style.display = 'none');
    }
    function deativate_all_tabs() {
        const tab_btns = document.querySelectorAll('.bca_widgets_home-tabs button');
        Array.from(tab_btns).forEach(item => {
            item.className = 'bca_widgets_home-tab-btn';
        });
    }
    function clone_template(template) {
        return template.content.cloneNode(true).children[0];
    }
    function removeSkeleton(parent_div) {
        parent_div.querySelector('#skeleton') ? parent_div.querySelector('#skeleton').remove() : '';
        return;
    }
    function checkDateThresholds(postDate) {
        const postTime = new Date(postDate).getTime();
        const now = Date.now();

        // Calculate absolute time difference in milliseconds
        const timeDiff = Math.abs(now - postTime);

        // Define time constants in milliseconds
        const ONE_DAY_MS = 24 * 60 * 60 * 1000 * 7;
        const ONE_WEEK_MS = 2 * ONE_DAY_MS;

        console.log(timeDiff);
        console.log(timeDiff < ONE_DAY_MS);
        console.log(timeDiff > ONE_DAY_MS);

        return {
            isLessThanADay: timeDiff < ONE_DAY_MS,
            isGreaterThanAWeek: timeDiff > ONE_WEEK_MS,
            timeDiffMs: timeDiff
        };
    }
    function createLoadMore(url) {
        let load_more = document.createElement('div');
        load_more.innerHTML = `<a href='${url}' class="button-15" style="
            width: 98%;
            box-sizing: border-box;
        ">Load More</button>`;
        load_more.style.display = 'flex';
        load_more.style.alignItems = 'center';
        return load_more;
    }

    // TAB Functions
    async function latestModsWidget() {
        await initFunctions(['BCA_Blogger']);

        async function loadTab(id) {

            let tab = document.getElementById(id);
            if (!tab)
                return;

            let label = tab.dataset.label;
            let blog_data = await BCA_Blogger.getData(label, 30);
            let filtered_data = BCA_Blogger.filterData(blog_data);

            if (!filtered_data)
                return;

            await buildHTML(label, filtered_data);
        }

        async function buildHTML(label, data) {
            await initFunctions(['moment']);
            const template = document.getElementById(`recent_${label}_widget_template`);
            const parent = document.getElementById(`bca_recent_${label}`);
            parent.innerHTML = ``;
            if (!template || !parent)
                return;

            data.forEach(item => {
                const clone = template.content.cloneNode(true).children[0];
                clone.href = item.url;
                clone.querySelector('div img').src = item.thumb.replace('s72-c', 's600-c');
                clone.querySelector('.bca_widgets_home-item-title').textContent = item.title;
                clone.querySelector('.bca_widgets_home-item-time').textContent = moment(new Date(item.date)).fromNow();

                let publish_latency = checkDateThresholds(item.date);

                if (publish_latency.isLessThanADay)
                    clone.querySelector('.bca_widgets_home-time-class').textContent = `LATEST`;

                else if (!publish_latency.isLessThanADay && !publish_latency.isGreaterThanAWeek) {
                    clone.querySelector('.bca_widgets_home-time-class').style.border = `1px solid yellow`;
                    clone.querySelector('.bca_widgets_home-time-class').style.color = `yellow`;
                    clone.querySelector('.bca_widgets_home-time-class').textContent = `RECENT`;
                }

                else {
                    clone.querySelector('.bca_widgets_home-time-class').style.border = `1px solid darkorange`;
                    clone.querySelector('.bca_widgets_home-time-class').style.color = `darkorange`;
                    clone.querySelector('.bca_widgets_home-time-class').textContent = `RIPED`;
                }

                renderWidgetTab(clone, parent);
            });

            let load_more = createLoadMore('https://battlecatsarchive.blogspot.com/search/label/mods');
            renderWidgetTab(load_more, parent);
        }

        function renderWidgetTab(clone, parent) {
            parent.appendChild(clone);
            removeSkeleton(parent);
        }

        function removeSkeleton(parent_div) {
            parent_div.querySelector('#skeleton') ? parent_div.querySelector('#skeleton').remove() : '';
            return;
        }

        function checkDateThresholds(postDate) {
            const postTime = new Date(postDate).getTime();
            const now = Date.now();

            // Calculate absolute time difference in milliseconds
            const timeDiff = Math.abs(now - postTime);

            // Define time constants in milliseconds
            const ONE_DAY_MS = 24 * 60 * 60 * 1000;
            const ONE_WEEK_MS = 7 * ONE_DAY_MS;

            return {
                isLessThanADay: timeDiff < ONE_DAY_MS,
                isGreaterThanAWeek: timeDiff > ONE_WEEK_MS,
                timeDiffMs: timeDiff
            };
        }

        await loadTab('bca_recent_mods');
    }
    async function loadLatestComments() {
        await initFunctions(['supabase', 'FirebaseModule']);
        let cur_user = await BCA_Users.getUserInfo('username');
        cur_user = cur_user?.length === 1 ? cur_user[0].username : '';

        let { data, error } = await supabase.from('bca-comments').select('id, date, fb_id, bca-website-posts(url), user_id!inner(username, prof_img, country)').not('user_id.username', 'eq', cur_user).order('date', { ascending: false }).limit(100);

        if (data.length === 0 || error) {
            console.log(error);
            return;
        }

        const template = document.getElementById('recent_comments_widget_template');
        const parent = document.getElementById('bca_recent_comments');

        if (!template || !parent)
            return;

        const promises = data.map(async (item) => {
            const clone = clone_template(template);
            clone.href = `https://battlecatsarchive.blogspot.com${item['bca-website-posts'].url}?target_comment=bca-comments-${item.id}`;
            clone.querySelector('.bca_widgets_home-comment-avatar').src = item.user_id.prof_img;
            clone.querySelector('.bca_widgets_home-comment-avatar').alt = item.user_id.username;
            clone.querySelector('.bca_widgets_home-comment-author').textContent = item.user_id.username;
            clone.dataset.comment_data = item.fb_id;
            clone.querySelector('.bca_widgets_home-comment-flag').src = item.user_id.country === "Anonymous" ? `https://lh3.googleusercontent.com/a/ACg8ocL8QR4ZoXB_XDEPJdwZ53b5wPXja1GSxRjn8GK-ToOlJIty2ZZ6=s96-c` : `https://flagsapi.com/${item.user_id.country}/shiny/64.png`;
            clone.querySelector('.bca_widgets_home-comment-flag').alt = item.user_id.country + "Citizen";
            clone.querySelector('.bca_widgets_home-comment-time').textContent = moment(item.date).fromNow();
            clone.querySelector('.bca_widgets_home-comment-path').textContent = item['bca-website-posts'].url;

            let time_latency = checkDateThresholds(item.date);

            if (time_latency.isLessThanADay)
                clone.querySelector('.bca_widgets_home-comment-time').style.color = `#00ff00`;

            else if (!time_latency.isLessThanADay && !time_latency.isGreaterThanAWeek)
                clone.querySelector('.bca_widgets_home-comment-time').style.color = `#ffe000`;

            else
                clone.querySelector('.bca_widgets_home-comment-time').style.color = `darkorange`;

            parent.appendChild(clone);

            const comment_content = await FirebaseModule.fetchJSON(`https://storehaccounts-comments-default-rtdb.firebaseio.com/bca_comments/${item.fb_id}/content.json`);
            clone.querySelector('.bca_widgets_home-comment-text').textContent = comment_content.replaceAll('\n', '').substring(0, 100) + ' ...';
        });

        removeSkeleton(parent);
    }
    async function loadLatestMembers() {
        let parent = document.getElementById('bca_recent_members');
        let template = document.getElementById('recent_members_widget_template');

        let { data, error } = await supabase.from('users').select('username, created_at, prof_img, email, country').limit(100).order('created_at', { ascending: false });

        if (data.length === 0 || error) {
            console.log(error);
            return;
        }

        data.forEach(item => {
            let clone = clone_template(template);
            clone.href = `https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${item.email}`;
            clone.querySelector('.bca_widgets_home-members-avatar').src = item.prof_img;
            clone.querySelector('.bca_widgets_home-members-avatar').alt = `User ${item.username}`;
            clone.querySelector('.bca_widgets_home-members-author').textContent = item.username;
            clone.querySelector('.bca_widgets_home-members-flag').src = item.country === "Anonymous" ? `https://lh3.googleusercontent.com/a/ACg8ocL8QR4ZoXB_XDEPJdwZ53b5wPXja1GSxRjn8GK-ToOlJIty2ZZ6=s96-c` : `https://flagsapi.com/${item.country}/shiny/64.png`;
            clone.querySelector('[timeago]').textContent = moment(item.created_at).fromNow();

            parent.appendChild(clone);
        });

        removeSkeleton(parent);
    }
    async function loadLatestTickets() {
        let { data, error } = await supabase.from('bca-ticket').select('fb_id, date, title, user_id(username, email, prof_img, country)').order('date', { ascending: false }).limit(50);

        if (data.length === 0 || error) {
            console.log(error);
            return;
        }

        const parent = document.getElementById('bca_recent_tickets');
        const template = document.getElementById('recent_tickets_widget_template');
        data.forEach(item => {
            const clone = clone_template(template);
            clone.href = `https://battlecatsarchive.blogspot.com/p/ticket-viewer.html?ticket=${item.fb_id}`;
            clone.querySelector('.bca_widgets_home-tickets-avatar').src = item.user_id.prof_img;
            clone.querySelector('.bca_widgets_home-tickets-avatar').alt = item.user_id.username;
            clone.querySelector('.bca_widgets_home-tickets-flag').src = item.user_id.country === "Anonymous" ? `https://lh3.googleusercontent.com/a/ACg8ocL8QR4ZoXB_XDEPJdwZ53b5wPXja1GSxRjn8GK-ToOlJIty2ZZ6=s96-c` : `https://flagsapi.com/${item.user_id.country}/shiny/64.png`;
            clone.querySelector('.bca_widgets_home-tickets-flag').alt = item.user_id.country;
            clone.querySelector('.bca_widgets_home-tickets-author').textContent = item.user_id.username;
            clone.querySelector('.bca_widgets_home-tickets-subject').textContent = item.title;
            clone.querySelector('.bca_widgets_home-tickets-time').textContent = moment(item.date).fromNow();

            parent.appendChild(clone);
        });

        let load_more = createLoadMore('https://battlecatsarchive.blogspot.com/p/ticket-support.html');
        parent.appendChild(load_more);
        removeSkeleton(parent);
    }

    power_up_tabs();
})();
