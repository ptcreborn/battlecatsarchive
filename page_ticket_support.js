(async () => {
    const dummy = document.querySelector('[dummy-template]');
    const ticket = document.querySelector('[ticket-support-template]');
    const parent = document.getElementById('ticket_parent');
    appendJSFile('https://cdn.jsdelivr.net/npm/moment@2.30.1/moment.min.js');

    createDummy();
    await getTickets();

    async function getTickets() {
        await initFunctions(['supabase', 'moment']);
        moment.updateLocale('en', {
            relativeTime: {
                future: 'in %s',
                past: '%s ago',
                s: '1s',
                ss: '%ss',
                m: '1m',
                mm: '%dm',
                h: '1h',
                hh: '%dh',
                d: '1d',
                dd: '%dd',
                M: '1mo',
                MM: '%dmo',
                y: '1y',
                yy: '%dy'
            }
        });

        let data = await getMetaData();

        let fragment = document.createDocumentFragment();

        parent.innerHTML = ``;

        const promises = data.map(async (item) => {
            const clone = ticket.content.cloneNode(true).children[0];
            const comment_count = await countComments(item.fb_id);
            clone.href = `https://battlecatsarchive.blogspot.com/p/ticket-viewer.html?ticket=${item.fb_id}`;
            clone.querySelector('.bca-ticket-title').textContent = item.title;
            clone.querySelector('.bca-ticket-image').src = item.user_id.prof_img;
            clone.querySelectorAll('.bca-ticket-meta span')[0].textContent = moment(parseInt(item.fb_id)).fromNow();
            clone.querySelectorAll('.bca-ticket-meta span')[1].textContent = `${comment_count} ${comment_count > 1 ? `comments` : `comment`}`;
            return clone;
        });


        const elements = await Promise.all(promises);

        for (const item of elements) fragment.appendChild(item);

        parent.innerHTML = ``;
        parent.appendChild(fragment);
    }

    async function getMetaData() {
        let key = `ticket-support`;
        let cached = retrievedData(key);
        if (cached)
            return cached;

        let { data, error } = await supabase.from('bca-ticket').select('title, user_id(prof_img), fb_id').order('date', { ascending: false });

        if (error || !data?.length === 0)
            return;

        cachedData(key, data);
        return data;
    }

    async function countComments(fb_id) {
        let data = await supabase.from('bca-ticket-comment').select('*', {
            count: 'exact',
            head: true
        }).eq('parent_id', fb_id).order('fb_id', { ascending: true });

        if (data.error)
            return;

        return data.count;
    }

    function createDummy() {
        const clone = dummy.content.cloneNode(true).children[0];
        parent.appendChild(clone);
    }

    function cachedData(key, data) {
        let exp = new Date().getTime();
        let str_data = JSON.stringify(data);

        localStorage.setItem(key, JSON.stringify({
            exp: exp,
            data: str_data
        })
        );
    }

    function retrievedData(key) {
        // check for pathname as key
        let data = localStorage.getItem(key);
        let base_data, new_data;

        if (!data)
            return;

        try {
            base_data = JSON.parse(data);
            new_data = JSON.parse(base_data.data);
        } catch (error) {
            console.log('error!');
            return;
        }

        // check for expiration time
        let now = new Date().getTime();
        if (now - JSON.parse(data).exp >= 120000) {
            localStorage.removeItem(key);
            return;
        }

        return new_data;
    }
})();
