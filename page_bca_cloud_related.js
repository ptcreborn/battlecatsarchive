
// May 11, 2026


(async () => {
    // build html
    const json_entry = 'https://battlecatsarchive.blogspot.com/feeds/posts/default/-/mods?alt=json&max=results=100';

    let data = await fetch(json_entry);
    let parsed_data = await data.json();
    let raw_data = parsed_data.feed.entry;
    let random = raw_data
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    const template = document.querySelector('[rl-template]');
    const parent = document.getElementById('rel_down');

    random.map(item => {
        let link = item.link.find(child => child.rel === "alternate");
        let title = link.title;
        link = link.href;
        let thumb = item.media$thumbnail.url.replace('s72-c', 's300');

        const clone = template.content.cloneNode(true).children[0];

        clone.querySelector('[rl-thumb]').src = thumb;
        clone.querySelector('[rl-title]').textContent = title;
        clone.querySelector('[rl-title]').href = link;

        parent.appendChild(clone);
    });
})();
