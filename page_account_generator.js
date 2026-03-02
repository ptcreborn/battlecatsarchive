(async () => {
        // decode the b64
    // create <p> tags
    // create <img> tags

    const info = document.getElementById('info');
    let url = window.location.href;
    let params = new URL(url).searchParams;

    let decoded_link = params.get('resource');

    try {
        decoded_link = JSON.parse(atob(decoded_link));
    } catch (e) {
        window.alert(`Corrupted Link! 
            
            ${params.get('resource')}..
        
        please report this to us by going to Contact Us.
            
            Further error: ${e}`);
    }

    info.innerHTML = `<table style="height: 127px;" width="100%">
<tbody>
<tr style="height: 35px;">
<td style="width: 23.0673%; height: 35px; text-align: right;">&nbsp;<strong>Account</strong></td>
<td style="width: 64.9327%; height: 35px; text-align: center;">
<div>${decoded_link.name}</div>
</td>
</tr>
<tr style="height: 35px; text-align: center;">
<td style="width: 23.0673%; height: 35px; text-align: right;">&nbsp;<strong>Request Date</strong></td>
<td style="width: 64.9327%; height: 35px;">&nbsp;
<div>${new Date(decoded_link.date)}</div>
</td>
</tr>
<tr style="height: 35px; text-align: center;">
<td style="width: 23.0673%; height: 35px; text-align: right;">&nbsp;<strong>Number of Ads Bypassed</strong></td>
<td style="width: 64.9327%; height: 35px;">&nbsp;
<div>${decoded_link.progress}</div>
</td>
</tr>
<tr style="height: 35px; text-align: center;">
<td style="width: 23.0673%; height: 35px; text-align: right;"><strong>Code</strong></td>
<td style="width: 64.9327%; height: 35px;">&nbsp;
    <img src='${decoded_link.link}'/>
  <br/>
  <a href='${decoded_link.link}' target='_blank'>View the code here</a>
  </td>
</tr>
</tbody>
</table>
    `;
})();
