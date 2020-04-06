// ==UserScript==
// @name        Pinkievisor Query
// @description Показывает пинкивизор при клике на статистику поста или коммента
// @include     http://tabun.everypony.ru/*
// @include     https://tabun.everypony.ru/*
// @version     0.0.2
// @grant       none
// @author      makise-homura
// ==/UserScript==

// I've just copied this part from andreymal's "tabun replies".
// Have no idea what it does; I guess it injects the script contents into a page.
// So we can actually keep variables inside it. It is significant for XHR callback.
(function(document, fn) {
  'use strict';
  var script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.textContent = '(' + fn + ')(window, window.document)';
  document.body.appendChild(script);
  document.body.removeChild(script);
})(document, function(window, document) {
  'use strict';

  function close_all_subwindows(event)
  {
    Array.from(document.getElementsByClassName('pinkievisor-subwindow')).forEach(function(item)
    {
      item.remove();
    });
  }

  function inject_iframe(body)
  {
    var content = '<html><head><link rel="stylesheet" href="https://pinkievisor.info/pv_styles/main_pv.css"></head><body>' + body + '</body></html>';

    // Somehow URI string don't like '#', but color and style works normally without that.
    return 'data:text/html;charset=utf-8,' + encodeURI(content.replace(/#/g,''));
  }

  function create_pinkie_url(id)
  {
    if (id.includes('pinkie_comment_'))
      return 'https://pinkievisor.info/pv_actions/select_comment/?id='+id.replace('pinkie_comment_','')

    else if (id.includes('pinkie_topic_'))
      return 'https://pinkievisor.info/pv_actions/select_topic/?id='+id.replace('pinkie_topic_','')

    console.log('Something went wrong! Can\'t create pinkie URL from id ' + id);
    return '';
  }

  function open_subwindow(event)
  {
    // May be customized? May be saved in the cookies?
    var w = 750;
    var h = 600;
    var closegap = 22;
    var safezone = 30;

    var x = event.pageX;
    var y = event.pageY;
    if (x + w > window.innerWidth - safezone) x = window.innerWidth - w - safezone;
    if (x < safezone) x = safezone;

    var pinkiediv = document.createElement('div');
    pinkiediv.style.left = x.toString() + 'px';
    pinkiediv.style.top = y.toString() + 'px';
    pinkiediv.style.width = w.toString() + 'px';
    pinkiediv.style.height = h.toString() + 'px';
    pinkiediv.style.position = 'absolute';
    pinkiediv.style.borderStyle = 'solid';
    pinkiediv.style.borderColor = '#FF0099';
    pinkiediv.style.backgroundColor = '#FFFFFF';
    pinkiediv.className = 'pinkievisor-subwindow';
    pinkiediv.id = 'pinkievisor-subwindow-' + event.target.id;
    pinkiediv.style.display = 'block';
    pinkiediv.style.zIndex = '21'; // z-index of "Refresh thread" button is 20; we'll pop up on top of it
    document.body.appendChild(pinkiediv);

    var resiframe = document.createElement("iframe");
    resiframe.style.width = '100%';
    resiframe.style.height = '100%';
    resiframe.src = inject_iframe('<img src="https://images.wikia.nocookie.net/siegenax/ru/images/3/31/Pinkie_walk.gif">');
    pinkiediv.appendChild(resiframe);

    fetch(create_pinkie_url(event.target.id)).then(response => response.text()).then(function(text)
    {
      var subdiv = document.createElement('div');
      subdiv.innerHTML = text;

      // Fix links
      Array('img', 'link', 'script').forEach(function(elementtype)
      {
        Array.from(subdiv.getElementsByTagName(elementtype)).forEach(function(element)
        {
          Array('src', 'href').forEach(function(attribute)
          {
            if(element.getAttribute(attribute) !== null && ! element.getAttribute(attribute).startsWith('http'))
            {
              element.setAttribute(attribute, 'https://pinkievisor.info/' + element.getAttribute(attribute));
            }
          });
        });
      });

      // Remove unneeded header (if it exists)
      var headers = subdiv.getElementsByTagName('h4');
      if (headers.length > 0) headers[0].remove();

      resiframe.src = inject_iframe(subdiv.innerHTML);
    });

    // If we don't call it, the body onclick event will kill this window just immediately
    event.stopPropagation();
  }

  function create_element(type, margin, id)
  {
    var created = document.createElement(type);
    created.innerHTML = '<img id="' + id + '" src="https://files.everypony.ru/smiles/38/7c/4b5d41.png" width="20px" style="margin-top: ' + margin + '">';
    created.className = 'pinkie-link';
    created.onclick = open_subwindow;
    created.style.cursor = 'pointer';
    created.title = 'Посмотреть статистику с пинкивизора';
    return created;
  }

  function alter_comments(collection)
  {
    Array.from(collection).forEach(function(infoblock)
    {
      // Don't add item to comment if already added
      if (infoblock.getElementsByClassName('pinkie-link').length == 0)
      {
        // id of comment's clickable will be 'pinkie_comment_N'
        var id = infoblock.getElementsByClassName('vote')[0].id.replace('vote_area_', 'pinkie_');
        infoblock.appendChild(create_element('li', '-3px', id));
      }
    });
  }

  function alter_post(collection)
  {
    if (typeof(collection[0]) !== 'undefined')
    {
      // id of post's clickable will be 'pinkie_topic_N'
      var id = collection[0].id.replace('vote_area_', 'pinkie_');
      collection[0].appendChild(create_element('span', '3px', id));
    }
  }

  alter_post(document.getElementsByClassName('vote-topic'));
  alter_comments(document.getElementsByClassName('comment-info'));

  document.body.addEventListener('click', close_all_subwindows);

  function alter_comments_callback(mutationsList, observer)
  {
    for (let mutation of mutationsList)
    {
      alter_comments(document.getElementsByClassName('comment-info'));
    }
  }

  var observer = new MutationObserver(alter_comments_callback);
  observer.observe(document.getElementById('comments'), { attributes: false, childList: true, subtree: false });
});
