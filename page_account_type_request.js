// Aug 18, 2026

(async () => {
    const form = document.querySelector('form.create-post');
    const submit = document.getElementById('submit_btn');
    await initFunctions(['BCA_Users']);

    let user_id = await BCA_Users.getUserInfo('id');
    if (!user_id) {
        window.alert(`You need to signin first before creating your account idea.`);
        window.location.href = `https://battlecatsarchive.blogspot.com/p/signin-to-bca.html`;
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        form.style.opacity = 0.7;
        form.style.pointerEvents = 'none';
        await createPost();
    });

    async function createPost() {
        let title = document.querySelector('[account-type-title]').value;
        let desc = document.querySelector('[account-type-description]').value;

        if (!(title && desc)) {
            window.alert("Error, please fill up the title and description.");
            return;
        }

        let data = {
            action: 'insert_account_type',
            title: title,
            description: desc,
            user_id: parseInt(user_id[0].id)
        }

        const url = `https://cold-water-0630.jasonbourne181997.workers.dev/insert_account_type`;
        let res = await fetch(url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }
        );

        let json = await res.json();

        if (!res.ok) {
            console.log(res);
            window.alert(`Problem in submitting post. ${json}`);
            return;
        }
    }
})();
