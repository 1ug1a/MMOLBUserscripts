// ==UserScript==
// @name         MMOLB Player Links
// @namespace    https://github.com/1ug1a
// @version      0.1.1
// @description  Provides direct links to individual player pages on the game watch page
// @author       1ug1a
// @match        *://mmolb.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mmolb.com
// @grant        none
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// ==/UserScript==

(function() {
  'use strict';

  const main = async () => {
    const URL = window.location.href;
    const GAME_ID = URL.split("/").pop();

    const getGameInfo = async () => {
      const response = await fetch('https://mmolb.com/api/game/' + GAME_ID);
      const json = await response.json();
      return json
    }

    const getCashewsApi = async (teamId) => {
      const response = await fetch('https://freecashe.ws/api/chron/v0/entities?kind=team_lite&id=' + teamId);
      const json = await response.json();
      return json.items[0].data
    }

    const getPlayers = async (teamInfo) => {
      let playerUrlObj = {}
      for (let id in teamInfo.Players) {
        let player = teamInfo.Players[id];
        let playerId = player.PlayerID
        let playerName = player.Emoji + ' ' + player.FirstName + ' ' + player.LastName
        // console.log(playerId)
        // console.log(playerName)
        playerUrlObj[playerName] = 'https://mmolb.com/player/' + playerId
      }
      return playerUrlObj
    }

    const gameInfo = await getGameInfo();

    const homeTeamId = gameInfo.HomeTeamID;
    const awayTeamId = gameInfo.AwayTeamID;

    const homeTeamInfo = await getCashewsApi(homeTeamId);
    const awayTeamInfo = await getCashewsApi(awayTeamId);

    const homeTeamPlayers = await getPlayers(homeTeamInfo);
    const awayTeamPlayers = await getPlayers(awayTeamInfo);

    const combinedPlayers = { ...homeTeamPlayers, ...awayTeamPlayers };
    // console.log(combinedPlayers);

    addPlayerLinks(combinedPlayers);

    const targetNode = $('div.mt-6.space-y-6')[0]
    // console.log(targetNode)
    new MutationObserver(function(mutations, observer) {
      // console.log(mutations, observer);
      addPlayerLinks(combinedPlayers);
    }).observe(targetNode, {childList: true});
  }

  async function addPlayerLinks(combinedPlayers) {
    // console.log("Running addPlayerLinks()...")
    for (let playerName in combinedPlayers) {
      var link = `<a href="${combinedPlayers[playerName]}">${playerName}</a>`;

      // batting box header
      $("div:contains(" + playerName + ")").filter(function() {
        return $(this).text().trim() === playerName;
      }).html(link)

      // pitching/batting/on deck
      $("div.text-xs.font-semibold.uppercase.tracking-wide.opacity-70").next().html(function(index, oldHtml) {
        // console.log(playerName.split(' ').slice(1).join(' '))
        return oldHtml !== link ? oldHtml.replace(playerName.split(' ').slice(1).join(' '), link) : oldHtml
      });
    }
    // console.log("Finished addPlayerLinks()!")
  }

  if (self.navigation) {
    navigation.addEventListener('navigatesuccess', onUrlChange);
  } else {
    let u = location.href;
    new MutationObserver(() => u !== (u = location.href) && onUrlChange())
      .observe(document, {subtree: true, childList: true});
  }

  function onUrlChange() {
    if (!location.pathname.startsWith('/watch')) {
      // deactivate();
      return;
    }
    console.log('MMOLB Player Links script by @1ug1a active!');
    main();
  }

  onUrlChange();
})();

