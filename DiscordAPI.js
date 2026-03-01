var DiscordAPI = {
    post: async function(username, avatar, title, message, thumbnail, url, webhook) {
        try {
            const response = await fetch(webhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    avatar_url: avatar,
                    "embeds": [{
                        "title": title,
                        "description": message,
                        "color": 3447003,
                        "image": {
                            url: `${thumbnail}`
                        },
                        url: `${url == '' ? 'https://battlecatsarchive.blogspot.com/' : url}`
                    }]
                })
            });

            if (response.ok) { // Check if the response status is 200-299
                console.log('Message sent successfully!');
            } else {
                const errorText = await response.text();
                console.error(`Error sending message: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Network or fetch error:', error);
        }
    }
}
