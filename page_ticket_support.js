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

        let { data, error } = await supabase.from('bca-ticket').select('title, user_id(prof_img), fb_id').order('date', { ascending: false });

        if (error || !data?.length === 0)
            return;

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

        for(const item of elements) fragment.appendChild(item);

        parent.innerHTML = ``;
        parent.appendChild(fragment);
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
})();
