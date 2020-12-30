// ==UserScript==
// @name        Pinkievisor Query
// @description Показывает пинкивизор при клике на статистику поста или коммента
// @include     http://tabun.everypony.ru/*
// @include     https://tabun.everypony.ru/*
// @version     0.0.6
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
    var content = '<html><head><link rel="stylesheet" href="https://pinkievisor.info/pv_styles/main_pv.css"></head><body>' +
        '<div style="border-radius: 5px; border-style: solid; border-color: #ff0099; background-color: #ffffff; opacity: 0.9; padding: 10px; line-height: 1.9; margin: 5px;">' +
        body + '</div></body></html>';

    // Somehow URI string don't like '#', but color and style works normally without that.
    return 'data:text/html;charset=utf-8,' + encodeURI(content.replace(/#/g,''));
  }

  function create_pinkie_id(stattype, id)
  {
    switch(stattype)
    {
      case 'comment':
      case 'topic':
        return id.replace('pinkie_' + stattype + '_','')
      case 'blog':
        return document.getElementsByClassName('topic-blog')[0].href; // Returns a link, not id, but it's ok for pinkievisor
      case 'user':
        return document.getElementsByClassName('user-login')[0].innerHTML;
    }
  }

  function create_pinkie_url(id)
  {
    var result = '';

    Array('comment', 'topic', 'user', 'blog').forEach(function(stattype)
    {
        if (id.includes('pinkie_' + stattype + '_'))
        {
          result = 'https://pinkievisor.info/pv_actions/select_' + stattype + '/?id=' + create_pinkie_id(stattype, id);
        }
    });

    if (result == '') console.log('Something went wrong! Can\'t create pinkie URL from id ' + id + ' with stattype ' + stattype);
    return result;
  }

  function open_subwindow(event)
  {
    function get_local_storage(key, default_value)
    {
       var value = localStorage.getItem(key);
       return (value === null) ? default_value : value;
    }

    var w = Number(get_local_storage('pinkie_w', '750'));
    var h = Number(get_local_storage('pinkie_h', '600'));
    var minsize = 100;
    var safezone = 30;
    var headersize = 16;

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

    var dragdiv = document.createElement('div');
    dragdiv.style.width = '100%';
    dragdiv.style.height = headersize + 'px';
    dragdiv.style.cursor = 'move';
    dragdiv.style.textAlign = 'center';
    dragdiv.style.color = '#FFFFFF';
    dragdiv.style.fontWeight = 'bold';
    dragdiv.style.marginTop = '-2px';
    dragdiv.style.paddingBottom = '2px';
    dragdiv.style.backgroundColor = '#FF0099';
    dragdiv.innerHTML = 'Статистика из Пинкивизора';
    dragdiv.title = 'Перемещать окно';
    pinkiediv.appendChild(dragdiv);

    var drag_x;
    var drag_y;

    function drag_execute(event)
    {
      pinkiediv.style.left = (event.clientX - drag_x) + 'px';
      pinkiediv.style.top = (event.clientY - drag_y) + 'px';
    }

    function drag_stop()
    {
      window.removeEventListener('mousemove', drag_execute);
      window.removeEventListener('mouseup', drag_stop);
    }

    function drag_start(event)
    {
      drag_x = event.clientX - pinkiediv.offsetLeft;
      drag_y = event.clientY - pinkiediv.offsetTop;
      window.addEventListener('mouseup', drag_stop);
      window.addEventListener('mousemove', drag_execute);
    }

    dragdiv.addEventListener('mousedown', drag_start);

    // To avoid closing window while dragging
    dragdiv.addEventListener('click', function(event) {event.stopPropagation();});

    var resiframe = document.createElement('iframe');
    resiframe.style.width = '100%';
    resiframe.style.height = (h - headersize) + 'px';
    resiframe.src = inject_iframe('<img style="margin-top: -35px" src="https://images.wikia.nocookie.net/siegenax/ru/images/3/31/Pinkie_walk.gif">');
    pinkiediv.appendChild(resiframe);

    var resizediv = document.createElement('div');
    resizediv.style.left = (w - 9) + 'px';
    resizediv.style.top = (h - 9) + 'px';
    resizediv.style.width = '12px';
    resizediv.style.height = '11px';
    resizediv.style.cursor = 'se-resize';
    resizediv.style.position = 'absolute';
    resizediv.innerHTML = '<span style="top: -6px; left: -3px; position: absolute; font-size: 16px; color: #FF0099;">&#x25E2;</span>';
    resizediv.title = 'Изменять размер окна';
    pinkiediv.appendChild(resizediv);

    var resize_dw;
    var resize_dh;

    function resize_execute(event)
    {
      w = event.clientX - resize_dw;
      h = event.clientY - resize_dh;
      if (w < minsize) w = minsize;
      if (h < minsize) h = minsize;
      pinkiediv.style.width = w + 'px';
      pinkiediv.style.height = h + 'px';
        resizediv.style.left = (w - 9) + 'px';
        resizediv.style.top = (h - 9) + 'px';
        resiframe.style.height = (h - headersize) + 'px';
    }

    function resize_stop()
    {
      window.removeEventListener('mousemove', resize_execute);
      window.removeEventListener('mouseup', resize_stop);
      localStorage.setItem('pinkie_w', w);
      localStorage.setItem('pinkie_h', h);
    }

    function resize_start(event)
    {
      resize_dw = event.clientX - w;
      resize_dh = event.clientY - h;
      window.addEventListener('mouseup', resize_stop);
      window.addEventListener('mousemove', resize_execute);
    }

    resizediv.addEventListener('mousedown', resize_start);

    // To avoid closing window while resizing
    resizediv.addEventListener('click', function(event) {event.stopPropagation();});

    fetch(create_pinkie_url(event.target.id)).then(response =>  response.ok ? response.text() : Promise.reject(response)).then(function(text)
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
              if(element.getAttribute(attribute).startsWith('//'))
              {
                element.setAttribute(attribute, 'https:' + element.getAttribute(attribute));
              }
              else
              {
                element.setAttribute(attribute, 'https://pinkievisor.info/' + element.getAttribute(attribute));
              }
            }
          });
        });
      });

      // Remove unneeded header (if it exists)
      var headers = subdiv.getElementsByTagName('h4');
      if (headers.length > 0) headers[0].remove();

      resiframe.src = inject_iframe(subdiv.innerHTML);
    }).catch((exc) =>
    {
      resiframe.src = inject_iframe('<img src="https://pinkievisor.info//smiles/4832.gif" width="70" height="70"> - Я просто не знаю, что пошло не так! Вот что мне говорят:<br>' + exc.message);
      console.log(exc);
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

  function alter_header(collection)
  {
    Array.from(collection).forEach(function(infoblock)
    {
      // id of post's clickable will be 'pinkie_{topic/blog/user}_N'
      var id = infoblock.id.replace('vote_area_', 'pinkie_');
      infoblock.appendChild(create_element('span', '3px', id));
    });
  }

  alter_header(document.getElementsByClassName('vote-topic'));
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
  if (document.getElementById('comments') !== null)
  {
    observer.observe(document.getElementById('comments'), { attributes: false, childList: true, subtree: true });
  }
});
