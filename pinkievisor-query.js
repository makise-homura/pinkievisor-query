// ==UserScript==
// @name        Pinkievisor Query
// @description Показывает пинкивизор при клике на статистику поста или коммента
// @include     http://tabun.everypony.ru/*
// @include     https://tabun.everypony.ru/*
// @version     0.0.1
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
    if (id.includes('vote_total_comment_'))
      return 'https://pinkievisor.info/pv_actions/select_comment/?id='+id.replace('vote_total_comment_','')

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
    document.body.appendChild(pinkiediv);

    var resiframe = document.createElement("iframe");
    resiframe.style.width = '100%';
    resiframe.style.height = '100%';
    resiframe.src = inject_iframe('<img src="https://images.wikia.nocookie.net/siegenax/ru/images/3/31/Pinkie_walk.gif">');
    pinkiediv.appendChild(resiframe);

    var pinkiexhr = new XMLHttpRequest();
    pinkiexhr.open('GET', create_pinkie_url(event.target.id), true);
    pinkiexhr.onreadystatechange = function()
    {
      if(pinkiexhr.readyState === XMLHttpRequest.DONE)
      {
        var subdiv = document.createElement('div');
        subdiv.innerHTML = pinkiexhr.response;

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
      }
    };
    pinkiexhr.send();

    // If we don't call it, the body onclick event will kill this window just immediately
    event.stopPropagation();
  }

  function alter_block(block)
  {
    // A comment
    if (block.tagName == 'SPAN' && block.id.substr(0,19) == 'vote_total_comment_')
    {
      block.onclick = open_subwindow;
      block.style.cursor = 'pointer';
      block.title = 'Посмотреть статистику с пинкивизора';
    }

    // A post
    else if (block.tagName == 'DIV' && typeof(block.children[0]) !== 'undefined' && block.children[0].id.substr(0,17) == "vote_total_topic_")
    {
      var addspan = document.createElement('span');
      addspan.innerHTML = '<img id="' + block.children[0].id.replace('vote_total_', 'pinkie_') + '" src="https://files.everypony.ru/smiles/38/7c/4b5d41.png" width="20px" style="vertical-align: middle">';
      addspan.onclick = open_subwindow;
      addspan.style.cursor = 'pointer';
      addspan.title = 'Посмотреть статистику с пинкивизора';
      block.appendChild(addspan);
    }
  }

  var count_blocks = document.getElementsByClassName('vote-count');
  for (let count_block of count_blocks) alter_block(count_block);

  document.body.addEventListener('click', close_all_subwindows);
});
