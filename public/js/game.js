const CDN_BASE_URL = "https://cdn.jsdelivr.net/gh/ethanlb34/Delta-Games@main/";

const GAMES_PER_PAGE = 30;
window.currentPage = 1;
window.showFNF = false; 

window.toggleFNF = function() {
    window.showFNF = !window.showFNF;
    const btn = document.getElementById('fnfToggleBtn');
    if (btn) {
        if (window.showFNF) {
            btn.textContent = "Hide FNF";
            btn.classList.remove('text-slate-500', 'line-through');
            btn.classList.add('text-baby-blue');
        } else {
            btn.textContent = "Show FNF";
            btn.classList.remove('text-slate-500', 'line-through');
            btn.classList.add('text-baby-blue');
        }
    }
    const searchInput = document.getElementById('searchInput');
    filterGames(searchInput ? searchInput.value : '');
}
window.currentLetter = 'A';
let currentFilteredGames = [];
window.paginationMode = 'pages';

let lastLaunchedGame = { link: null, name: null }; 
let currentFilterType = 'All Games'; 
let currentView = 'catalog'; 
const FAVORITES_STORAGE_KEY = 'delta_game_favorites'; 

const GAMES = [
    { name: "UGS Library (1,700 Games)", path: "gamelibrary.html", type: "Action", image: "gamelibrary.png" },
    { name: "8 Ball Classic", path: "cl8ballclassic.html", type: "Sports", image: "cl8ballclassic.png" },
    { name: "8 Ball Pool", path: "8 Ball Pool.html", type: "Sports", image: "8 Ball Pool.png" },
    { name: "10 Minutes Till Dawn", path: "cl10minutestildawn.html", type: "Action", image: "cl10minutestildawn.png" },
    { name: "12 Mini Battles", path: "cl12minibattles.html", type: "Action", image: "cl12minibattles.png" },
    { name: "1v1 LOL", path: "cl1v1lol.html", type: "Shooter", image: "cl1v1lol.png" },
    { name: "2D Shooting", path: "cl2Dshooting.html", type: "Shooter", image: "cl2Dshooting.png" },
    { name: "2-3-4 Player Game", path: "cl234playergame.html", type: "Action", image: "cl234playergame.png" },
    { name: "3 Dash", path: "cl3dash.html", type: "Rhythm", image: "cl3dash.png" },
    { name: "3D Pinball Space Cadet", path: "cl3dpinballspacecadet.html", type: "Classic", image: "cl3dpinballspacecadet.png" },
    { name: "2048 Puzzle", path: "cl2048.html", type: "Puzzle", image: "cl2048.png" },
    { name: "99 Nights In A Forest", path: "cl99nightsitf.html", type: "Action", image: "cl99nightsitf.png" },
    { name: "Among Us", path: "clamongus.html", type: "Action", image: "clamongus.png" },
    { name: "Antonblast", path: "Antonblast.html", type: "Action", image: "Antonblast.png" },
    { name: "Airline Tycoon Idle", path: "clairlinetycoonidle.html", type: "Action", image: "clairlinetycoonidle.png" },
    { name: "Achilles 2", path: "clachillies2.html", type: "Action", image: "clachillies2.png" },
    { name: "A Dance Of Fire And Ice", path: "clADOFAI.html", type: "Simulation", image: "clADOFAI.png" },
    { name: "A Day in the Office", path: "cladayintheoffice.html", type: "Simulation", image: "cladayintheoffice.png" },
    { name: "Age of War", path: "clageofwar.html", type: "Strategy", image: "clageofwar.png" },
    { name: "Age of War 2", path: "clageofwar2.html", type: "Strategy", image: "clageofwar2.png" },
    { name: "Agarilite", path: "clagariolite.html", type: "IO", image: "clagariolite.png" },
    { name: "Ages of Conflict", path: "clagesofconflict.html", type: "Strategy", image: "clagesofconflict.png" },
    { name: "Ahoy Survival", path: "clahoysurvival.html", type: "Survival", image: "clahoysurvival.png" },
    { name: "Amigo Pancho", path: "clamigopancho.html", type: "Puzzle", image: "clamigopancho.png" },
    { name: "Amigo Pancho 2", path: "clamigopancho2.html", type: "Puzzle", image: "clamigopancho2.png" },
    { name: "Amigo Pancho 3", path: "clamigopancho3.html", type: "Puzzle", image: "clamigopancho3.png" },
    { name: "Amigo Pancho 4", path: "clamigopancho4.html", type: "Puzzle", image: "clamigopancho4.png" },
    { name: "Amigo Pancho 5", path: "clamigopancho5.html", type: "Puzzle", image: "clamigopancho5.png" },
    { name: "Amigo Pancho 6", path: "clamigopancho6.html", type: "Puzzle", image: "clamigopancho6.png" },
    { name: "Amigo Pancho 7", path: "clamigopancho7.html", type: "Puzzle", image: "clamigopancho7.png" },
    { name: "Angry Birds", path: "clangrybirds.html", type: "Physics", image: "clangrybirds.png" },
    { name: "Angry Birds Chrome", path: "Angry Birds Chrome.html", type: "Physics", image: "Angry Birds Chrome.png" },
    { name: "Apple Shooter", path: "clappleshooter.html", type: "Action", image: "clappleshooter.png" },
    { name: "Apple Worm", path: "clappleworm.html", type: "Puzzle", image: "clappleworm.png" },
    { name: "Archery World Tour", path: "clarcheryworldtour.html", type: "Sports", image: "clarcheryworldtour.png" },
    { name: "Bad Bodyguards", path: "clbadbodyguards.html", type: "Indie", image: "clbadbodyguards.png" },
    { name: "Bad Parenting 1", path: "Bad Parenting 1.html", type: "Indie", image: "Bad Parenting 1.png" },
    { name: "Buckshot Roulette", path: "Buckshot Roulette.html", type: "Indie", image: "Buckshot Roulette.png" },
    { name: "Orange Roulette", path: "Orange Roulette.html", type: "Indie", image: "Orange Roulette.png" },
    { name: "Bowmasters", path: "Bowmasters.html", type: "Indie", image: "Bowmasters.png" },
    { name: "BuildNow.gg", path: "BuildNow.gg.html", type: "Indie", image: "BuildNow.gg.png" },
    { name: "Bad Piggies", path: "clbadpiggies.html", type: "Physics", image: "clbadpiggies.jpg" },
    { name: "Banana Simulator", path: "clbananasimulator.html", type: "Indie", image: "clbananasimulator.jpg" },
    { name: "Block the Pig", path: "clblockthepig.html", type: "Puzzle", image: "clblockthepig.jpg" },
    { name: "Baldi's Basics", path: "clbaldisbasics.html", type: "Horror", image: "clbaldisbasics.png" },
    { name: "Baldi's Basics Plus", path: "Baldi's Basics Plus.html", type: "Horror", image: "Baldi's Basics Plus.png" },
    { name: "Remaster Baldi's Basics ", path: "clbaldisbasicsremaster.html", type: "Horror", image: "clbaldisbasicsremaster.png" },
    { name: "Ultimate Baldi Basics", path: "clbaldisfunnewschoolultimate.html", type: "Horror", image: "clbaldisfunnewschoolultimate.png" },
    { name: "Decompile Baldi Basics", path: "clbaldidecomp.html", type: "Horror", image: "clbaldidecomp.png" },
    { name: "Bloxorz", path: "Bloxorz.html", type: "Action", image: "Bloxorz.png" },
    { name: "Big NEON Tower Tiny Square", path: "Big NEON Tower Tiny Square.html", type: "Action", image: "Big NEON Tower Tiny Square.png" },
    { name: "Big ICE Tower Tiny Square", path: "Big ICE Tower Tiny Square.html", type: "Action", image: "Big ICE Tower Tiny Square.png" },
    { name: "3D Bowling", path: "3D Bowling.html", type: "Action", image: "3D Bowling.png" },
    { name: "Bank Robbery 1", path: "Bank Robbery.html", type: "Action", image: "Bank Robbery.png" },
    { name: "Bank Robbery 2", path: "clbankrobbery2.html", type: "Action", image: "clbankrobbery2.png" },
    { name: "Bank Robbery 3", path: "Bank Robbery 3.html", type: "Action", image: "Bank Robbery 3.png" },
    { name: "Basket Random", path: "clbasketrandom.html", type: "Sports", image: "clbasketrandom.png" },
    { name: "Bacon May Die", path: "clbaconmaydie.html", type: "Action", image: "clbaconmaydie.png" },
    { name: "Baseball Bros", path: "clbaseballbros.html", type: "Sports", image: "clbaseballbros.png" },
    { name: "Backyard Baseball", path: "clbackyardbaseball.html", type: "Sports", image: "clbackyardbaseball.png" },
    { name: "Backyard Baseball 9", path: "clbackyardbaseball09.html", type: "Sports", image: "clbackyardbaseball09.png" },
    { name: "Backyard Baseball 10", path: "clbackyardbaseball10.html", type: "Sports", image: "clbackyardbaseball10.png" },
    { name: "League Baseball", path: "clKenGriffeyJrPresentsMajorLeagueBaseball.html", type: "Sports", image: "clKenGriffeyJrPresentsMajorLeagueBaseball.png" },
    { name: "Bloons TD 4", path: "clbloonsTD4.html", type: "Tower Defense", image: "clbloonsTD4.png" },
    { name: "Brawl Stars", path: "clBrawlstars.html", type: "Action", image: "clBrawlstars.png" },
    { name: "Burrito Bison Launcha Libre", path: "clburritobisonlaunchalibre.html", type: "Action", image: "clburritobisonlaunchalibre.png" },
    { name: "Buster Jam", path: "clBusterJam.html", type: "Action", image: "clBusterJam.png" },
    { name: "Basketball Legends", path: "clbballlegend.html", type: "Sports", image: "clbballlegend.png" },
    { name: "Basketball Stars", path: "clbasketballstars.html", type: "Sports", image: "clbasketballstars.png" },
    { name: "Basketball Bros", path: "clbasketbros.html", type: "Sports", image: "clbasketbros.png" },
    { name: "Battle Simulator", path: "clbattlesim.html", type: "Strategy", image: "clbattlesim.jpg" },
    { name: "Bad Time Simulator", path: "clbadtimesim.html", type: "Action", image: "clbadtimesim.png" },
    { name: "BitLife", path: "clbitlife.html", type: "Life Sim", image: "clbitlife.png" },
    { name: "Blackjack", path: "clblackjack.html", type: "Card Game", image: "clblackjack.png" },
    { name: "Block Blast", path: "clblockblast.html", type: "Puzzle", image: "clblockblast.png" },
    { name: "Block Blast V2", path: "clblockblastv2.html", type: "Puzzle", image: "clblockblastv2.png" },
    { name: "Bloons TD 5", path: "clbloonsTD5.html", type: "Tower Defense", image: "clbloonsTD5.jpg" },
    { name: "Bob The Robber 2", path: "clbobtherobber2.html", type: "Stealth", image: "clbobtherobber2.png" },
    { name: "Bob The Robber 5", path: "clbobtherobber5.html", type: "Stealth", image: "clbobtherobber5.png" },
    { name: "Bottle Jump 3D", path: "clbottlejump3d.html", type: "Arcade", image: "clbottlejump3d.jpg" },
    { name: "Candy Crush", path: "Candy Crush.html", type: "Shooter", image: "Candy Crush.png" },
    { name: "CG FC 25", path: "CG FC 25.html", type: "Shooter", image: "CG FC 25.png" },
    { name: "Color Water Sort 3D", path: "Color Water Sort 3D.html", type: "Shooter", image: "Color Water Sort 3D.png" },
    { name: "Call of Duty 4 (COD4)", path: "clcod4.html", type: "Shooter", image: "clcod4.png" },
    { name: "Call of Duty: Black Ops", path: "clcodblackops.html", type: "Shooter", image: "clcodblackops.png" },
    { name: "Car King Arena", path: "clcarkingarena.html", type: "Racing", image: "clcarkingarena.png" },
    { name: "Crush Cars 3D", path: "Crush Cars 3D.html", type: "Racing", image: "Crush Cars 3D.png" },
    { name: "Checkers", path: "clcheckers.html", type: "Board Game", image: "clcheckers.png" },
    { name: "Chess", path: "clchess.html", type: "Board Game", image: "clchess.png" },
    { name: "Clash Royale", path: "clclashofvikings.html", type: "Strategy", image: "clclashofvikings.png" },
    { name: "Cluster Rush", path: "clclusterrush.html", type: "Platformer", image: "clclusterrush.jpg" },
    { name: "Cod Zombies", path: "clcodzombies.html", type: "Shooter", image: "codzombies.png" },
    { name: "Cookie Clicker", path: "clcookieclickercool.html", type: "Clicker", image: "clcookieclickercool.png" },
    { name: "Cooking Mama 3", path: "clcookingmama3.html", type: "Simulation", image: "clcookingmama3.png" },
    { name: "Core Ball", path: "clcoreball.html", type: "Arcade", image: "clcoreball.png" },
    { name: "Command Strike", path: "clcommandstrike.html", type: "Shooter", image: "clcommandstrike.png" },
    { name: "Counter-Strike 1.6", path: "clcs1.6.html", type: "Shooter", image: "clcs1.6.jpg" },
    { name: "Crazy Cattle 3D", path: "clcrazycattle3d.html", type: "Simulation", image: "clcrazycattle3d.png" },
    { name: "Crazy Chicken 3D", path: "clcrazychicken3D.html", type: "Simulation", image: "clcrazychicken3D.png" },
    { name: "Crazy Kitty 3D", path: "Crazy Kitty 3D.html", type: "Simulation", image: "Crazy Kitty 3D.png" },
    { name: "Crazy Motorcycle", path: "clcrazymotorcycle.html", type: "Racing", image: "clcrazymotorcycle.png" },
    { name: "Crazy Plane Landing", path: "clcrazyplanelanding.html", type: "Arcade", image: "clcrazyplanelanding.png" },
    { name: "Crossy Road", path: "clcrossyroad.html", type: "Arcade", image: "clcrossyroad.png" },
    { name: "Curve Ball", path: "clcurveball.html", type: "Arcade", image: "clcurveball.png" },
    { name: "Dash IO", path: "cldashio.html", type: "Arcade", image: "cldashio.png" },
    { name: "Dash Arena", path: "cldasharena.html", type: "Arcade", image: "cldasharena.png" },
    { name: "Dig to China", path: "cldigtochina.html", type: "Arcade", image: "cldigtochina.jpg" },
    { name: "Draw the Line", path: "cldrawtheline.html", type: "Indie", image: "cldrawtheline.png" },
    { name: "Doge Miner", path: "cldogeminer.html", type: "Clicker", image: "cldogeminer.png" },
    { name: "Doge Miner 2", path: "cldogeminer2.html", type: "Clicker", image: "cldogeminer2.png" },
    { name: "Doom 2", path: "Doom 2.html", type: "Shooter", image: "doom 2.png" },
    { name: "Doom 3", path: "Doom 3.html", type: "Shooter", image: "Doom 3.png" },
    { name: "Doom DOS", path: "cldoomdos.html", type: "Shooter", image: "cldoomdos.png" },
    { name: "Doom ZIO", path: "cldoomzio.html", type: "Shooter", image: "cldoomzio.png" },
    { name: "2D Doom", path: "cl2doom.html", type: "Shooter", image: "cl2doom.png" },
    { name: "Draw Climber", path: "cldrawclimber.html", type: "Arcade", image: "cldrawclimber.png" },
    { name: "Drift Hunters", path: "cldrifthuntersmerge.html", type: "Racing", image: "cldrifthuntersmerge.png" },
    { name: "Drift Simulator", path: "cldriftsimulator.html", type: "Racing", image: "cldriftsimulator.png" },
    { name: "Drift Boss", path: "cldriftboss.html", type: "Racing", image: "cldriftboss.png" },
    { name: "Drive Mad", path: "cldrivemad.html", type: "Racing", image: "cldrivemad.jpg" },
    { name: "Duck Life", path: "clducklife.html", type: "Arcade", image: "clducklife.png" },
    { name: "Duck Life 2", path: "clducklife2.html", type: "Arcade", image: "clducklife2.png" },
    { name: "Duck Life 3", path: "clducklife3.html", type: "Arcade", image: "clducklife3.png" },
    { name: "Duck Life 4", path: "clducklife4.html", type: "Arcade", image: "clducklife4.png" },
    { name: "Duck Life 5", path: "clducklfe5.html", type: "Arcade", image: "clducklfe5.png" },
    { name: "Duck Life 8", path: "Duck Life 8.html", type: "Arcade", image: "Duck Life 8.png" },
    { name: "Deltarune", path: "cldeltarune.html", type: "RPG", image: "cldeltarune.png" },
    { name: "Dunk Shot", path: "cldunkshot.html", type: "Sports", image: "cldunkshot.png" },
    { name: "Extreme Run 3D", path: "clextremerun3d.html", type: "Arcade", image: "clextremerun3d.png" },
    { name: "Elastic Face", path: "clelasticface.html", type: "Arcade", image: "clelasticface.png" },
    { name: "Escape Road", path: "clescaperoad.html", type: "Racing", image: "clescaperoad.png" },
    { name: "Escape Road 2", path: "clescaperoad2.html", type: "Racing", image: "clescaperoad2.png" },
    { name: "Final Fantasy VII", path: "Final Fantasy VII.html", type: "Action", image: "Final Fantasy VII.png" },
    { name: "Fire And Frost Master", path: "Fire and Frost Master.html", type: "Action", image: "fire and frost master.png" },
    { name: "Feed Us 5", path: "clfeedus5.html", type: "Action", image: "clfeedus5.png" },
    { name: "Fami Dash", path: "clfamidash.html", type: "Platformer", image: "clfamidash.png" },
    { name: "Five Night's At Freddy's 1", path: "clFNAF.html", type: "Horror", image: "clFNAF.jpg" },
    { name: "Five Night's At Freddy's 2", path: "clFNAF2.html", type: "Horror", image: "clFNAF2.png" },
    { name: "Five Night's At Freddy's 3", path: "clFNAF3.html", type: "Horror", image: "clFNAF3.png" },
    { name: "Five Night's At Freddy's 4", path: "clFNAF4.html", type: "Horror", image: "clFNAF4.png" },
    { name: "Five Night's At Baldis Redone", path: "clfivenightsatbaldisredone.html", type: "Horror", image: "clfivenightsatbaldisredone.png" },
    { name: "FNAC 1", path: "clfnac1.html", type: "Horror", image: "clfnac1.png" },
    { name: "FNAC 2", path: "clfnac2.html", type: "Horror", image: "clfnac2.png" },
    { name: "Five Night's At 4 Halloween", path: "clfnaf4halloween.html", type: "Horror", image: "clfnaf4halloween.png" },
    { name: "Five Night's At PS", path: "clfnafps.html", type: "Horror", image: "clfnafps.png" },
    { name: "Five Night's At UCN", path: "clfnafucn.html", type: "Horror", image: "clfnafucn.png" },
    { name: "Five Night's At SL", path: "clfnafsl.html", type: "Horror", image: "clfnafsl.png" },
    { name: "Five Night's At Freddy's Worldd Refreshed", path: "Five Nights at Freddy's_ World Refreshed.html", type: "RPG", image: "Five Nights at Freddy's_ World Refreshed.png" },
    { name: "Five Night's At Winston's", path: "Five Nights at Winston's.html", type: "RPG", image: "Five Nights at Winston's.png" },
    { name: "Five Night's At Candy's", path: "Five Nights at Candy's.html", type: "RPG", image: "Five Nights at Candy's.png" },
    { name: "Five Night's At Candy's 2", path: "Five Nights at Candy's 2.html", type: "RPG", image: "Five Nights at Candy's 2.png" },
    { name: "Bite At Freddy's", path: "A Bite at Freddy's.html", type: "RPG", image: "A Bite at Freddy's.png" },
    { name: "Five Night's At Freddy's World", path: "clfnafworldd.html", type: "RPG", image: "clfnafworldd.png" },
    { name: "Football Bros", path: "clfootballbros.html", type: "Sports", image: "clfootballbros.png" },
    { name: "Football Legends", path: "clfootballlegends.html", type: "Sports", image: "clfootballlegends.png" },
    { name: "Fallout", path: "clfallout.html", type: "RPG", image: "clfallout.png" },
    { name: "Fruit Ninja", path: "clfruitninja.html", type: "Arcade", image: "clfruitninja.png" },
    { name: "Fort Zone", path: "clfortzone.html", type: "Shooter", image: "clfortzone.png" },
    { name: "From Rust to Ash", path: "clfromrusttoash.html", type: "Survival", image: "clfromrusttoash.png" },
    { name: "Funny Battle", path: "clfunnybattle.html", type: "Action", image: "clfunnybattle.png" },
    { name: "Funny Battle 2", path: "clfunnybattle2.html", type: "Action", image: "clfunnybattle2.png" },
    { name: "Funny Shooter 2", path: "clfunnyshooter2.html", type: "Shooter", image: "clfunnyshooter2.png" },
    { name: "Funny Mad Racing", path: "clfunnymadracing.html", type: "Racing", image: "clfunnymadracing.png" },
    { name: "FIFA 07", path: "clFIFA07.html", type: "Sports", image: "clFIFA07.png" },
    { name: "FIFA 10", path: "FIFA 10.html", type: "Sports", image: "FIFA 10.png" },
    { name: "FIFA 11", path: "FIFA 11.html", type: "Sports", image: "FIFA 11.png" },
    { name: "FIFA 99", path: "clFIFA99.html", type: "Sports", image: "clFIFA99.png" },
    { name: "FIFA Intl Soccer", path: "clFIFAinternationalsoccer.html", type: "Sports", image: "clFIFAinternationalsoccer.png" },
    { name: "Fireboy and Watergirl", path: "clfireboyandwatergirl.html", type: "Platformer", image: "clfireboyandwatergirl.png" },
    { name: "Fireboy and Watergirl 2", path: "clfireboyandwatergirl2.html", type: "Platformer", image: "clfireboyandwatergirl2.png" },
    { name: "Fireboy and Watergirl 3", path: "clfireboyandwatergirl3.html", type: "Platformer", image: "clfireboyandwatergirl3.png" },
    { name: "Fireboy and Watergirl 5", path: "clfireboyandwatergirl5.html", type: "Platformer", image: "clfireboyandwatergirl5.png" },
    { name: "Fireboy and Watergirl 6", path: "clfireboyandwatergirl6.html", type: "Platformer", image: "clfireboyandwatergirl6.png" },
    { name: "Flood Runner 4", path: "clfloodrunner4.html", type: "Runner", image: "clfloodrunner4.png" },
    { name: "Fluidism", path: "clfluidism.html", type: "Simulation", image: "clfluidism.png" },
    { name: "FNF", path: "clfridaynightfunkin.html", type: "Rhythm", image: "clfridaynightfunkin.jpg"},
    { name: "FNF Agoti", path: "clfnfagoti.html", type: "Rhythm", image: "clfnfagoti.png" },
    { name: "FNF B-Side", path: "clfnfbside.html", type: "Rhythm", image: "clfnfbside.png" },
    { name: "FNF vs Bob v2.0", path: "FNF vs Bob v2.0 (Bob’s Onslaught).html", type: "Rhythm", image: "FNF vs Bob v2.0 (Bob’s Onslaught).png" },
    { name: "FNF BFDI26", path: "clfnfbfdi26.html", type: "Rhythm", image: "clfnfbfdi26.png" },
    { name: "FNF Black Betrayal", path: "clfnfblackbetrayal.html", type: "Rhythm", image: "clfnfblackbetrayal.png" },
    { name: "FNF Camellia Rude Blaster", path: "clfnfcamelliarudeblaster.html", type: "Rhythm", image: "clfnfcamelliarudeblaster.png" },
    { name: "FNF Candy Carrier", path: "clfnfcandycarrier.html", type: "Rhythm", image: "clfnfcandycarrier.png" },
    { name: "FNF Cory", path: "clfnfcory.html", type: "Rhythm", image: "clfnfcory.png" },
    { name: "FNF Crunchin", path: "clfnfcrunchin.html", type: "Rhythm", image: "clfnfcrunchin.png" },
    { name: "FNF Cybersensation", path: "clcybersensation.html", type: "Rhythm", image: "clcybersensation.png" },
    { name: "FNF Desolation", path: "clfnfdesolation.html", type: "Rhythm", image: "clfnfdesolation.png" },
    { name: "FNF Doki Takeover Plus", path: "clfnfdokitakeoverplus.html", type: "Rhythm", image: "clfnfdokitakeoverplus.png" },
    { name: "FNF Drop and Roll", path: "clfnfdropandroll.html", type: "Rhythm", image: "clfnfdropandroll.png" },
    { name: "FNF Dustin", path: "clfnfdustin.html", type: "Rhythm", image: "clfnfdustin.png" },
    { name: "FNF Fleetway", path: "clfnffleetway.html", type: "Rhythm", image: "clfnffleetway.png" },
    { name: "FNF FNAF 3", path: "clfnffnaf3.html", type: "Rhythm", image: "clfnffnaf3.png" },
    { name: "FNF Game Breaker Bundle", path: "clfnfgamebreakerbundle.html", type: "Rhythm", image: "clfnfgamebreakerbundle.png" },
    { name: "FNF Garcello", path: "clgarcello.html", type: "Rhythm", image: "clgarcello.png" },
    { name: "FNF Golden Apple", path: "clfnfgoldenapple.html", type: "Rhythm", image: "clfnfgoldenapple.png" },
    { name: "FNF Hex", path: "clfnfhex.html", type: "Rhythm", image: "clfnfhex.png" },
    { name: "FNF Herobrine", path: "clfnfherobrine.html", type: "Rhythm", image: "clfnfherobrine.png" },
    { name: "FNF Hit Single Real", path: "clhitsinglereal.html", type: "Rhythm", image: "clhitsinglereal.png" },
    { name: "FNF Holiday", path: "clfnfholiday.html", type: "Rhythm", image: "clfnfholiday.png" },
    { name: "FNF Hork Glorp Gloop", path: "clfnfhorkglorpgloop.html", type: "Rhythm", image: "clfnfhorkglorpgloop.png" },
    { name: "FNF Hypno Lullaby", path: "clfnfhypnoslullaby.html", type: "Rhythm", image: "clfnfhypnoslullaby.png" },
    { name: "FNF Imposter V4", path: "clfnfimposterv4.html", type: "Rhythm", image: "clfnfimposterv4.png" },
    { name: "FNF Indie Cross", path: "clfnfindiecross.html", type: "Rhythm", image: "clfnfindiecross.png" },
    { name: "FNF Infernal Bout", path: "clfnfinfernalbout.html", type: "Rhythm", image: "clfnfinfernalbout.png" },
    { name: "FNF Iron Lung", path: "clfnfironlung.html", type: "Rhythm", image: "clfnfironlung.png" },
    { name: "FNF Kapi", path: "clkapi.html", type: "Rhythm", image: "clkapi.png" },
    { name: "FNF Madness Poop", path: "clfnfmadnesspoop.html", type: "Rhythm", image: "clfnfmadnesspoop.png" },
    { name: "FNF Mario", path: "clmariomadness.html", type: "Rhythm", image: "clmariomadness.png" },
    { name: "FNF Mario Madness D-Side", path: "clfnfmariomadnessdside.html", type: "Rhythm", image: "clfnfmariomadnessdside.png" },
    { name: "FNF Matt", path: "clmattv2.html", type: "Rhythm", image: "clmattv2.png" },
    { name: "FNF Matt V3", path: "clfnfmattv3.html", type: "Rhythm", image: "clfnfmattv3.png" },
    { name: "FNF MC Madness", path: "clfnfmcmadness.html", type: "Rhythm", image: "clfnfmcmadness.png" },
    { name: "FNF Midnght Fight", path: "clfnfmidfight.html", type: "Rhythm", image: "clfnfmidfight.png" },
    { name: "FNF Miku", path: "clfnfmiku.html", type: "Rhythm", image: "clfnfmiku.png" },
    { name: "FNF Mob Mod", path: "clfnfmobmod.html", type: "Rhythm", image: "clfnfmobmod.png" },
    { name: "FNF Neo", path: "clfnfneo.html", type: "Rhythm", image: "clfnfneo.png" },
    { name: "FNF Our Ple Guy", path: "clourpleguy.html", type: "Rhythm", image: "clourpleguy.png" },
    { name: "FNF Piggy Field", path: "clfnfpiggyfield.html", type: "Rhythm", image: "clfnfpiggyfield.png" },
    { name: "FNF Pibby Apocalypse", path: "clpibbyapocalypse.html", type: "Rhythm", image: "clpibbyapocalypse.png" },
    { name: "FNF Poke Pasta Perdition", path: "clfnfpokepastaperdition.html", type: "Rhythm", image: "clfnfpokepastaperdition.png" },
    { name: "FNF QT", path: "clfnfqt.html", type: "Rhythm", image: "clfnfqt.png" },
    { name: "FNF Rewrite", path: "clfnfrewrite.html", type: "Rhythm", image: "clfnfrewrite.png" },
    { name: "FNF Rewrite ROUND 2", path: "VS Rewrite_ ROUND 2.html", type: "Rhythm", image: "VS Rewrite_ ROUND 2.png" },
    { name: "FNF Rev Mixed", path: "clfnfrevmixed.html", type: "Rhythm", image: "clfnfrevmixed.png" },
    { name: "FNF Self Paced", path: "clfnfselfpaced.html", type: "Rhythm", image: "clfnfselfpaced.png" },
    { name: "FNF Shaggy", path: "clshaggy.html", type: "Rhythm", image: "clshaggy.png" },
    { name: "FNF Shaggy (Easy)", path: "clfnfshaggy4keys.html", type: "Rhythm", image: "clfnfshaggy4keys.png" },
    { name: "FNF Shaggy X Matt", path: "clfnfshaggyxmatt.html", type: "Rhythm", image: "clfnfshaggyxmatt.png" },
    { name: "FNF Shucks V2", path: "clfnfshucks-v2.html", type: "Rhythm", image: "clfnfshucks-v2.png" },
    { name: "FNF Sky", path: "clfnfsky.html", type: "Rhythm", image: "clfnfsky.png" },
    { name: "FNF SMB Game Over", path: "clsmbgameover.html", type: "Rhythm", image: "clsmbgameover.png" },
    { name: "FNF Soft", path: "clfnfsoft.html", type: "Rhythm", image: "clfnfsoft.png" },
    { name: "FNF Sonic.exe", path: "clfnfsonicexe4.html", type: "Rhythm", image: "clfnfsonicexe4.jpg" },
    { name: "FNF Tails Gets Trolled", path: "clfnftailsgetstrolled.html", type: "Rhythm", image: "clfnftailsgetstrolled.png" },
    { name: "FNF Tricky", path: "clfnftricky.html", type: "Rhythm", image: "clfnftricky.png" },
    { name: "FNF Twiddlefinger", path: "clfnfTWIDDLEFINGER.html", type: "Rhythm", image: "clfnfTWIDDLEFINGER.png" },
    { name: "FNF Wednesday Infidelity", path: "clfnfwednesday-infedility.html", type: "Rhythm", image: "clfnfwednesday-infedility.png" },
    { name: "FNF Whitty", path: "clfnfwhitty.html", type: "Rhythm", image: "clfnfwhitty.png" },
    { name: "FNF Zardy", path: "clfnfzardy.html", type: "Rhythm", image: "clfnfzardy.png" },
    { name: "Geometry Dash", path: "clgdlite.html", type: "Rhythm", image: "clgdlite.png" },
    { name: "Geometry Dash Editor", path: "cl3dasheditor.html", type: "Rhythm", image: "cl3dasheditor.png" },
    { name: "Geometry Dash Lite", path: "clgeometrydashscratch.html", type: "Rhythm", image: "clgeometrydashscratch.png" },
    { name: "Geometry Dash Subzero", path: "clgdsubzero.html", type: "Rhythm", image: "clgdsubzero.png" },
    { name: "Geometry Vibes", path: "clgeometryvibes.html", type: "Rhythm", image: "clgeometryvibes.png" },
    { name: "Geometry Arrow", path: "geometryarrow.html", type: "Rhythm", image: "geometryarrow.jpg" },
    { name: "Getaway Shootout", path: "clgetawayshootout.html", type: "Action", image: "clgetawayshootout.png" },
    { name: "God's Flesh", path: "God's Flesh.html", type: "Action", image: "God's Flesh.png" },
    { name: "Get Yoked", path: "Get Yoked.html", type: "Action", image: "Get Yoked.png" },
    { name: "Google Baseball", path: "clgooglebaseball.html", type: "Sports", image: "clgooglebaseball.png" },
    { name: "Getting Over It", path: "Getting Over It with Bennett Foddy.html", type: "Arcade", image: "Getting Over It with Bennett Foddy.png" },
    { name: "Google Dino", path: "clgoogledino.html", type: "Arcade", image: "clgoogledino.png" },
    { name: "Granny", path: "granny.html", type: "Horror", image: "clgranny.png" },
    { name: "Granny 2", path: "clgranny22.html", type: "Horror", image: "clgranny22.png" },
    { name: "Granny 3", path: "clgranny3.html", type: "Horror", image: "clgranny3.png" },
    { name: "Granny Online", path: "clgranny2.html", type: "Horror", image: "clgranny2.png" },
    { name: "Grow a Garden", path: "clgrowagarden.html", type: "Simulation", image: "clgrowagarden.png" },
    { name: "GTA Advance", path: "clgrandtheftautoadvance.html", type: "Action", image: "clgtaadv.png" },
    { name: "GTA (Classic)", path: "clgta22.html", type: "Action", image: "clgta22.png" },
    { name: "Guess Their Answer", path: "clguesstheiranswer.html", type: "Puzzle", image: "clguesstheiranswer.png" },
    { name: "Gun Mayhem 2", path: "clgunmayhem2.html", type: "Shooter", image: "clgunmayhem2.png" },
    { name: "Gunspin", path: "clgunspin.html", type: "Arcade", image: "clgunspin.png" },
    { name: "Half-Life", path: "clhalflife.html", type: "Shooter", image: "clhalflife.png" },
    { name: "Half-Life Opposing Force", path: "Half Life_ Opposing Force.html", type: "Shooter", image: "Half Life_ Opposing Force.png" },
    { name: "Hollow Knight", path: "Hollow Knight.html", type: "Shooter", image: "Hollow Knight.png" },
    { name: "Hardware Tycoon", path: "clhardwaretycoon.html", type: "Simulation", image: "clhardwaretycoon.png" },
    { name: "Hit 8ox", path: "clhit8ox.html", type: "Arcade", image: "clhit8ox.png" },
    { name: "Hitstun Fly", path: "clhitstunfly.html", type: "Arcade", image: "clhitstunfly.png" },
    { name: "Hole Battle", path: "clholebattle.html", type: "Action", image: "clholebattle.png" },
    { name: "Hot Wax", path: "clhotwax.html", type: "Arcade", image: "clhotwax.png" },
    { name: "House Of Hazards", path: "clhouseofhazards.html", type: "Action", image: "clhouseofhazards.png" },
    { name: "Happy Wheels", path: "clhappywheels.html", type: "Physics", image: "clhappywheels.jpg" },
    { name: "Highway Racer", path: "Highway Racer.html", type: "Physics", image: "Highway Racer.png" },
    { name: "Highway Racer 2", path: "Highway Racer 2.html", type: "Physics", image: "Highway Racer 2.png" },
    { name: "Highway Racer 2 REMASTERED", path: "Highway Racer 2 REMASTERED.html", type: "Physics", image: "Highway Racer 2 REMASTERED.png" },
    { name: "Harvest.io", path: "clharvestio.html", type: "IO", image: "clharvestio.png" },
    { name: "Heist", path: "clhei$t.html", type: "Action", image: "clheist.png" },
    { name: "Helix Jump", path: "clhelixjump.html", type: "Arcade", image: "clheilxjump.png" },
    { name: "Hide N Seek", path: "clhidenseek.html", type: "Arcade", image: "clhidenseek.png" },
    { name: "Hole.io", path: "clholeio.html", type: "IO", image: "clholeio.png" },
    { name: "Iron lung", path: "Iron Lung.html", type: "Clicker", image: "Iron Lung.png" },
    { name: "Idle Miner Tycoon", path: "clidleminertycoon.html", type: "Clicker", image: "clidleminertycoon.png" },
    { name: "Islander", path: "clislander.html", type: "Survival", image: "clislander.jpg" },
    { name: "Infinite Craft", path: "clinfinitecraft.html", type: "Puzzle", image: "clinfinitecraft.png" },
    { name: "Karlson", path: "Karlson.html", type: "Platformer", image: "Karlson.png" },
    { name: "Jumbo Mario", path: "cljumbomario.html", type: "Platformer", image: "cljumbomario.png" },
    { name: "Just Fall LOL", path: "cljustfalllol.html", type: "Platformer", image: "cljustfalllol.jpg" },
    { name: "Kindergarten", path: "Kindergarten.html", type: "Platformer", image: "Kindergarten.png" },
    { name: "Kindergarten 2", path: "Kindergarten 2.html", type: "Platformer", image: "Kindergarten 2.png" },
    { name: "Kindergarten 3", path: "Kindergarten 3.html", type: "Platformer", image: "Kindergarten 3.png" },
    { name: "Learn to Fly 1", path: "Learn to Fly.html", type: "Physics", image: "Learn to Fly.png" },
    { name: "Learn to Fly 2", path: "Learn to Fly 2.html", type: "Physics", image: "Learn to Fly 2.png" },
    { name: "Learn to Fly 3", path: "cllearntofly3.html", type: "Physics", image: "cllearntofly3.png" },
    { name: "Learn to Fly Idle", path: "Learn to Fly Idle.html", type: "Physics", image: "Learn to Fly Idle.png" },
    { name: "Little Alchemy 2", path: "cllittlealchemy2.html", type: "Puzzle", image: "cllittlealchemy2.png" },
    { name: "Lode Runner", path: "clloderunner.html", type: "Classic", image: "clloderunner.png" },
    { name: "Metal Gear Solid", path: "Metal Gear Solid.html", type: "Sports", image: "Metal Gear Solid.png" },
    { name: "Magic Tiles 3", path: "Magic Tiles 3.html", type: "Sports", image: "Magic Tiles 3.png" },
    { name: "Monster Tracks", path: "Monster Tracks.html", type: "Sports", image: "Monster Tracks.png" },
    { name: "Madalin Stunt Cars 2", path: "Madalin Stunt Cars 2.html", type: "Sports", image: "Madalin Stunt Cars 2.png" },
    { name: "Madalin Stunt Cars 3", path: "Madalin Stunt Cars 3.html", type: "Sports", image: "Madalin Stunt Cars 3.png" },
    { name: "Madden 98", path: "clmadden98.html", type: "Sports", image: "clmadden98.png" },
    { name: "Madness Combat Defense", path: "clmadnesscombatdefense.html", type: "Tower Defense", image: "clmadnesscombatdefense.png" },
    { name: "Madness Combat FPS", path: "madnesscombatfps.html", type: "Shooter", image: "madnesscombatfps.jpg" },
    { name: "Madness Combat Nexus (Classic)", path: "Madness Combat_ Project Nexus (classic).html", type: "Shooter", image: "Madness Combat_ Project Nexus (classic).png" },
    { name: "Midnight Shift", path: "Midnight Shift.html", type: "Shooter", image: "Midnight Shift.png" },
    { name: "Mega Man 7", path: "clmegaman7.html", type: "Classic", image: "clmegaman7.png" },
    { name: "Melon Playground", path: "clmelonplayground.html", type: "Sandbox", image: "clmelonplayground.jpg" },
    { name: "People Playground", path: "People Playground.html", type: "Sandbox", image: "People Playground.png" },
    { name: "Mighty Knight 2", path: "clmightyknight2.html", type: "RPG", image: "clmightyknight2.png" },
    { name: "Mind Wave", path: "clmindwave.html", type: "Action", image: "clmindwave.png" },
    { name: "Minesweeper Plus", path: "Minesweeper Plus.html", type: "Sandbox", image: "Minesweeper Plus.png" },
    { name: "Minesweeper Mania", path: "Minesweeper Mania.html", type: "Sandbox", image: "Minesweeper Mania.png" },
    { name: "Minecraft", path: "EaglercraftX_1.8_u53_Offline_Signed.html", type: "Sandbox", image: "clminecraft1-8-8.png" },
    { name: "Mortal Kombat 2", path: "clmortalkombat2.html", type: "Fighting", image: "clmortalkombat2.png" },
    { name: "Mortal Kombat 3", path: "clmortalkombat3.html", type: "Fighting", image: "clmortalkombat3.png" },
    { name: "Moto Road Rash 3D 2", path: "motoroadrash3d2.html", type: "Racing", image: "motoroadrash3d2.png" },
    { name: "Moto X3M", path: "clmotox3mm.html", type: "Racing", image: "clmotox3mm.png" },
    { name: "Moto X3M 2", path: "clmotox3m2.html", type: "Racing", image: "clmotox3m2.png" },
    { name: "Moto X3M 3", path: "clmotox3m3.html", type: "Racing", image: "clmotox3m3.png" },
    { name: "Moto X3M Pool Party", path: "clmotox3mpoolparty.html", type: "Racing", image: "clmotox3mpoolparty.png" },
    { name: "Moto X3M Spooky Land", path: "clmotox3mspookyland.html", type: "Racing", image: "clmotox3mspookyland.png" },
    { name: "Moto X3M Winter", path: "clmotox3mwinter.html", type: "Racing", image: "clmotox3mwinter.png" },
    { name: "Monkey Mart", path: "clmonkeymart.html", type: "Simulation", image: "clmonkeymart.png" },
    { name: "Mountain Bike Racer", path: "clmountainbikeracer.html", type: "Racing", image: "clmountainbikeracer.png" },
    { name: "Null Kevin", path: "clnullkevin.html", type: "Sports", image: "clnullkevin.png" },
    { name: "NBA Jam", path: "clnbajam.html", type: "Sports", image: "clnbajam.png" },
    { name: "Not Your Pawn", path: "clnotyourpawn.html", type: "Strategy", image: "clnotyourpawn.png" },
    { name: "Nugget Clicker", path: "clomeganuggetclicker.html", type: "Clicker", image: "clomeganuggetclicker.png" },
    { name: "Only Up!", path: "clonlyup.html", type: "Platformer", image: "clonlyup.jpg" },
    { name: "OSU!", path: "closu.html", type: "Rhythm", image: "closu.jpg" },
    { name: "OVO", path: "clovofixed.html", type: "Platformer", image: "clovofixed.png" },
    { name: "OVO 2", path: "clovo2.html", type: "Platformer", image: "clovo2.png" },
    { name: "OVO Dimensions", path: "clovodimensions.html", type: "Platformer", image: "clovodimensions.png" },
    { name: "Pokemon Fire Red", path: "clpokemonfirered.html", type: "Classic", image: "clpokemonfirered.png" },
    { name: "Pokemon Emerald", path: "clpokemonemerald.html", type: "Classic", image: "clpokemonemerald.png" },
    { name: "Pokemon Odyssey", path: "clpokeodyssey.html", type: "Classic", image: "clpokeodyssey.png" },
    { name: "Pac-Man", path: "clpacman.html", type: "Classic", image: "clpacman.jpg" },
    { name: "Pac-Man (Horror)", path: "PacMan (Horror).html", type: "Classic", image: "PacMan (Horror).png" },
    { name: "Pac-Man Superfast", path: "Pac-Man Superfast.html", type: "Classic", image: "Pac-Man Superfast.png" },
    { name: "Pac-Man World ", path: "Pac Man World 2.html", type: "Classic", image: "Pac Man World 2.png" },
    { name: "Pac-Man World 2", path: "Pac Man World.html", type: "Classic", image: "Pac Man World.png" },
    { name: "Papa's Freezeria", path: "clpapasfreezeria.html", type: "Simulation", image: "clpapasfreezeria.png" },
    { name: "Papa's Wingeria", path: "Papa's Wingeria.html", type: "Simulation", image: "Papa's Wingeria.png" },
    { name: "Papa's Taco Mia", path: "Papa's Taco Mia.html", type: "Simulation", image: "Papa's Taco Mia.png" },
    { name: "Papa's Sushiria", path: "Papa's Sushiria.html", type: "Simulation", image: "Papa's Sushiria.png" },
    { name: "Papa's Scooperia", path: "Papa's Scooperia.html", type: "Simulation", image: "Papa's Scooperia.png" },
    { name: "Papa's Pizeria", path: "Papa's Pizeria.html", type: "Simulation", image: "Papa's Pizeria.png" },
    { name: "Papa's Pastaria", path: "Papa's Pastaria.html", type: "Simulation", image: "Papa's Pastaria.png" },
    { name: "Papa's Pancakeria", path: "Papa's Pancakeria.html", type: "Simulation", image: "Papa's Pancakeria.png" },
    { name: "Papa's Hot Doggeria", path: "Papa's Hot Doggeria.html", type: "Simulation", image: "Papa's Hot Doggeria.png" },
    { name: "Papa's Donuteria", path: "Papa's Donuteria.html", type: "Simulation", image: "Papa's Donuteria.png" },
    { name: "Papa's Cupcakeria", path: "Papa's Cupcakeria.html", type: "Simulation", image: "Papa's Cupcakeria.png" },
    { name: "Papa's Cheeseria", path: "Papa's Cheeseria.html", type: "Simulation", image: "Papa's Cheeseria.png" },
    { name: "Papa's Burgeria", path: "Papa's Burgeria.html", type: "Simulation", image: "Papa's Burgeria.png" },
    { name: "Papa's Bakeria", path: "Papa's Bakeria.html", type: "Simulation", image: "Papa's Bakeria.png" },
    { name: "Paper.io", path: "clpaperio.html", type: "IO", image: "clpaperio.png" },
    { name: "Paper.io 3D", path: "clpaperio3d.html", type: "IO", image: "clpaperio3d.png" },
    { name: "Paperio Mania", path: "clpaperiomania.html", type: "IO", image: "clpaperiomania.png" },
    { name: "Parking Fury", path: "clparkingfury.html", type: "Simulation", image: "clparkingfury.png" },
    { name: "Parking Fury 2", path: "clparkingfury2.html", type: "Simulation", image: "clparkingfury2.png" },
    { name: "Parking Fury 3", path: "clparkingfury3.html", type: "Simulation", image: "clparkingfury3.png" },
    { name: "Parking Rush", path: "clparkingrush.html", type: "Puzzle", image: "clparkingrush.png" },
    { name: "Police Pursuit 2", path: "clpolicepursuit2.html", type: "Racing", image: "clpolicepursuit2.png" },
    { name: "Plants vs Zombies", path: "Plants vs Zombies.html", type: "Simulation", image: "Plants vs Zombies.png" },
    { name: "Polytrack Work Snow", path: "clpolytrackworksnow.html", type: "Simulation", image: "clpolytrackworksnow.png" },
    { name: "Push Your Luck", path: "clpushyourluck.html", type: "Arcade", image: "clpushyourluck.png" },
    { name: "Quake 3", path: "clquake3.html", type: "Shooter", image: "clquake3.png" },
    { name: "Riddle School", path: "Riddle School.html", type: "Action", image: "Riddle School.png" },
    { name: "Riddle School 2", path: "Riddle School 2.html", type: "Action", image: "Riddle School 2.png" },
    { name: "Riddle School 3", path: "Riddle School 3.html", type: "Action", image: "Riddle School 3.png" },
    { name: "Riddle School 4", path: "Riddle School 4.html", type: "Action", image: "Riddle School 4.png" },
    { name: "Riddle School 5", path: "Riddle School 5.html", type: "Action", image: "Riddle School 5.png" },
    { name: "Riddle Transfer", path: "Riddle Transfer.html", type: "Action", image: "Riddle Transfer.png" },
    { name: "Riddle Transfer 2", path: "Riddle Transfer 2.html", type: "Action", image: "Riddle Transfer 2.png" },
    { name: "Run", path: "Run 1.html", type: "Action", image: "Run 1.png" },
    { name: "Run 2", path: "Run 2.html", type: "Action", image: "Run 2.png" },
    { name: "Run 3", path: "Run 3.html", type: "Action", image: "Run 3.png" },
    { name: "Red Ball", path: "Red Ball.html", type: "Action", image: "Red Ball.png" },
    { name: "Red Ball 2", path: "Red Ball 2.html", type: "Action", image: "Red Ball 2.png" },
    { name: "Red Ball 3", path: "Red Ball 3.html", type: "Action", image: "Red Ball 3.png" },
    { name: "Red Ball 4", path: "Red Ball 4.html", type: "Action", image: "Red Ball 4.png" },
    { name: "Red Ball 4 Vol. 2", path: "Red Ball 4 Vol. 2.html", type: "Action", image: "Red Ball 4 Vol. 2.png" },
    { name: "Red Ball 4 Vol. 3", path: "Red Ball 4 Vol. 3.html", type: "Action", image: "Red Ball 4 Vol. 3.png" },
    { name: "Raft", path: "Raft.html", type: "Action", image: "Raft.png" },
    { name: "Raft Wars 2", path: "clraftwars2.html", type: "Action", image: "clraftwars2.jpg" },
    { name: "Rogue Sergeant The Final Operation", path: "Rogue Sergeant The Final Operation.html", type: "Action", image: "Rogue Sergeant The Final Operation.png" },
    { name: "Ragdoll Archers", path: "clragdollarchers.html", type: "Action", image: "clragdollarchers.png" },
    { name: "Ragdoll Hit", path: "clragollhit.html", type: "Action", image: "clragollhit.png" },
    { name: "Ragdoll Soccer", path: "clragdollsoccer.html", type: "Sports", image: "clragdollsoccer.png" },
    { name: "Ragdoll Runners", path: "clragdollrunners.html", type: "Sports", image: "clragdollrunners.png" },
    { name: "Ragdoll.io", path: "clragdollio.html", type: "IO", image: "clragdollio.png" },
    { name: "Retro Bowl", path: "clretrobowl.html", type: "Sports", image: "clretrobowl.png" },
    { name: "Retro Bowl College", path: "clretrobowlcollege.html", type: "Sports", image: "clretrobowlcollege.png" },
    { name: "Retro Ping Pong", path: "clretropingpong.html", type: "Classic", image: "clretropingpong.jpg" },
    { name: "Roblox (not real)", path: "cldoblox.html", type: "Sandbox", image: "cldoblox.png" },
    { name: "Rocket League", path: "clrocketleague.html", type: "Sports", image: "clrocketleague.png" },
    { name: "Rocket Soccer Derby", path: "clrocketsoccerderby.html", type: "Sports", image: "clrocketsoccerderby.png" },
    { name: "Rooftop Snipers", path: "clrooftopsnipers.html", type: "Shooter", image: "clrooftopsnipers.png" },
    { name: "Rooftop Snipers 2", path: "clrooftopsnipers2.html", type: "Shooter", image: "clrooftopsnipers2.png" },
    { name: "Run 3", path: "clrun3.html", type: "Runner", image: "clrun3.png" },
    { name: "Survivor.io", path: "Survivor.io.html", type: "Action", image: "Survivor.io.png" },
    { name: "Supreme Duelist", path: "Supreme Duelist.html", type: "Action", image: "Supreme Duelist.png" },
    { name: "Slime Rancher", path: "Slime Rancher.html", type: "Action", image: "Slime Rancher.png" },
    { name: "Station Saturn", path: "Station Saturn.html", type: "Action", image: "Station Saturn.png" },
    { name: "Station 141", path: "Station 141.html", type: "Action", image: "Station 141.png" },
    { name: "Super Star Car", path: "Super Star Car.html", type: "Action", image: "Super Star Car.png" },
    { name: "Sandboxels", path: "clsandboxels.html", type: "Sandbox", image: "clsandboxels.png" },
    { name: "Schoolboy Runaway", path: "Schoolboy Runaway.html", type: "Sandbox", image: "Schoolboy Runaway.png" },
    { name: "Sandtris", path: "clsandtris.html", type: "Puzzle", image: "clsandtris.png" },
    { name: "Sentry Fortress", path: "clsentryfortress.html", type: "Tower Defense", image: "clsentryfortress.jpg" },
    { name: "Slipways", path: "clslipways.html", type: "Strategy", image: "clslipways.jpg" },
    { name: "Slither.io", path: "clslitherio.html", type: "IO", image: "clslitherio.png" },
    { name: "Slice It All", path: "Slice it All.html", type: "Runner", image: "Slice it All.png" },
    { name: "Swords and Souls", path: "Swords and Souls.html", type: "Runner", image: "Swords and Souls.png" },
    { name: "Slope", path: "clslopeplus.html", type: "Runner", image: "clslopeplus.png" },
    { name: "Slope 2 Player", path: "clslope2player.html", type: "Runner", image: "clslope2player.png" },
    { name: "Slope 3", path: "clslope3.html", type: "Runner", image: "clslope3.png" },
    { name: "Smash Karts (Working)", path: "clsmashkartsworking.html", type: "IO", image: "clsmashkartsworking.png" },
    { name: "Sniper V2", path: "clsniperv2.html", type: "Shooter", image: "clsniperv2.png" },
    { name: "Solar Sandbox", path: "clsolarsandbox.html", type: "Simulation", image: "clsolarsandbox.png" },
    { name: "Sonic.exe OG", path: "clsoniceexeog.html", type: "Horror", image: "clsoniceexeog.png" },
    { name: "Sonic.exe ORIGINAL", path: "Sonic.EXE (ORIGINAL).html", type: "Horror", image: "Sonic.EXE (ORIGINAL).png" },
    { name: "Sonic the Hedgehog 3 Angel Island Remasterd", path: "Sonic the Hedgehog 3_ Angel Island Remastered.html", type: "Classic", image: "Sonic the Hedgehog 3_ Angel Island Remastered.png" },
    { name: "Sonic the Hedgehog 2 Community Cut", path: "Sonic the Hedgehog 2_ Community's Cut.html", type: "Classic", image: "Sonic the Hedgehog 2_ Community's Cut.png" },
    { name: "Sonic the CD", path: "Sonic CD.html", type: "Classic", image: "Sonic CD.png" },
    { name: "Sonic Mania", path: "Sonic Mania.html", type: "Classic", image: "Sonic Mania.png" },
    { name: "Sonic the Hedgehog 3", path: "clsonicthehedgehog3.html", type: "Classic", image: "clsonicthehedgehog3.png" },
    { name: "Space Bar Clicker", path: "clspacebarclicker.html", type: "Clicker", image: "clspacebarclicker.png" },
    { name: "Space Waves", path: "clspacewaves.html", type: "Arcade", image: "clspacewaves.png" },
    { name: "Slow Roads", path: "clslowroad.html", type: "Racing", image: "clslowroads.png" },
    { name: "Small World Cup", path: "clasmallworldcup.html", type: "Sports", image: "clasmallworldcup.png" },
    { name: "Sniper Shot", path: "clsnipershot.html", type: "Shooter", image: "clsnipershot.png" },
    { name: "Super Cold", path: "clsupercold.html", type: "Shooter", image: "clsupercold.png" },
    { name: "Super Hot", path: "clsuperhot(2).html", type: "Shooter", image: "clsuperhot.png" },
    { name: "Super Hot 2D", path: "clsuperhotlinemiami.html", type: "Shooter", image: "clsuperhotlinemiami.png" },
    { name: "Snow Rider", path: "clsnowrider.html", type: "Racing", image: "clsnowrider.png" },
    { name: "Soccer Bros", path: "clsoccerbros.html", type: "Sports", image: "clsoccerbros.png" },
    { name: "Soccer Random", path: "clsoccerrandomgood.html", type: "Sports", image: "clsoccerrandomgood.png" },
    { name: "Solar Smash", path: "clsolarsmash.html", type: "Simulation", image: "clsolarsmash.jpg" },
    { name: "Solitaire", path: "clsolitaire.html", type: "Card Game", image: "clsolitaire.png" },
    { name: "Sprunki", path: "clsprunki.html", type: "Rhythm", image: "clsprunki.jpg" },
    { name: "Stack Tris", path: "clstacktris.html", type: "Puzzle", image: "clstacktris.png" },
    { name: "State.io", path: "clstateio.html", type: "Strategy", image: "clstateio.png" },
    { name: "Steal A Brainrot.", path: "clsupitdept.html", type: "Simulation", image: "clsupitdept.png" },
    { name: "Steal A Brainrot Duel", path: "clsabduel.html", type: "Action", image: "clsabduel.png" },
    { name: "Stickman Golf", path: "Stickman Golf.html", type: "Strategy", image: "Stickman Golf.png" },
    { name: "Stick Ragdoll Fight", path: "Stickman Fight Ragdoll.html", type: "Strategy", image: "Stickman Fight Ragdoll.png" },
    { name: "Stick Destruction", path: "Stickman Destruction.html", type: "Strategy", image: "Stickman Destruction.png" },
    { name: "Stick Man And Guns", path: "clstickmanandguns.html", type: "Strategy", image: "clstickmanandguns.png" },
    { name: "Stick Man GTA City", path: "clstickmangtacity.html", type: "Strategy", image: "clstickmangtacity.png" },
    { name: "Stick Jet Challange", path: "clstickjetchallenge.html", type: "Strategy", image: "clstickjetchallenge.png" },
    { name: "Stick Defenders", path: "clstickdefenders.html", type: "Strategy", image: "clstickdefenders.png" },
    { name: "Stick Archers Battle", path: "clstickarchersbattle.html", type: "Strategy", image: "clstickarchersbattle.png" },
    { name: "Stick Merge", path: "clstickmerge.html", type: "Strategy", image: "clstickmerge.png" },
    { name: "Stick Slasher", path: "clstickslasher.html", type: "Strategy", image: "clstickslasher.png" },
    { name: "Stick War Legacy", path: "Stick War_ Legacy.html", type: "Strategy", image: "Stick War_ Legacy.png" },
    { name: "Stick War 2", path: "clstickwar2.html", type: "Strategy", image: "clstickwar2.png" },
    { name: "Stickman Hook", path: "clstickmanhook.html", type: "Platformer", image: "clstickmanhook.jpg" },
    { name: "Stickman Duel", path: "clstickmanduel.html", type: "Fighting", image: "clstickmanduel.png" },
    { name: "Stickman Kombat 2D", path: "clstickmankombat2d.html", type: "Fighting", image: "clstickmankombat2d.png" },
    { name: "Stickman Clash", path: "clstickmanclash.html", type: "Fighting", image: "clstickmanclash.png" },
    { name: "Stickman Kingdom Clash", path: "clStickmanKingdomclash.html", type: "Strategy", image: "clStickmanKingdomclash.png" },
    { name: "Storm The House 3", path: "clstormthehouse3.html", type: "Shooter", image: "clstormthehouse3.jpg" },
    { name: "Street Fighter 2", path: "clstreetfighter2.html", type: "Fighting", image: "clstreetfighter2.png" },
    { name: "Strike Force Heroes 3", path: "clstrikeforceheroes3.html", type: "Shooter", image: "clstrikeforceheroes3.jpg" },
    { name: "Subway Surfers", path: "clsubwaysurfersmiami.html", type: "Runner", image: "clsubwaysurfersmiami.png" },
    { name: "Super Bomberman 2", path: "clsuperbomberman2.html", type: "Classic", image: "clsuperbomberman2.jpg" },
    { name: "Super Mario Bros", path: "Super Mario Bros.html", type: "Classic", image: "Super Mario Bros.png" },
    { name: "Super Mario Bros 3", path: "clmario3.html", type: "Classic", image: "clmario3.jpg" },
    { name: "Super Mario Bros 64", path: "Super Mario 64.html", type: "Classic", image: "Super Mario 64.png" },
    { name: "Super Mario Kart", path: "clsupermariokart.html", type: "Racing", image: "clsupermariokart.jpg" },
    { name: "Survival Race", path: "clsurvivalracev2.html", type: "Racing", image: "clsurvivalracev2.png" },
    { name: "Survival Race V2", path: "clsurvivalracev2.html", type: "Racing", image: "clsurvivalracev2.jpg" },
    { name: "Terraria", path: "Terraria.html", type: "Action", image: "Terraria.png" },
    { name: "Tunnel Rush", path: "Tunnel Rush.html", type: "Action", image: "Tunnel Rush.png" },
    { name: "Table Tanks", path: "cltabletanks.html", type: "Action", image: "cltabletanks.png" },
    { name: "Table Tennis World Tour", path: "cltabletennisworldtour.html", type: "Sports", image: "cltabletennisworldtour.png" },
    { name: "Tag", path: "cltag-.html", type: "Action", image: "cltag-.png" },
    { name: "Telephone Trouble", path: "cltelephonetrouble.html", type: "Indie", image: "cltelephonetrouble.png" },
    { name: "Temple Run 2", path: "cltemplerun2.html", type: "Runner", image: "cltemplerun2.png" },
    { name: "Territorial.io", path: "clterritorialio.html", type: "Strategy", image: "clterritorialio.jpg" },
    { name: "The Man in the Window", path: "clthemaninthewindow.html", type: "Horror", image: "clthemaninthewindow.png" },
    { name: "That's Not My Neighbor", path: "That's Not My Neighbor.html", type: "Horror", image: "That's Not My Neighbor.png" },
    { name: "Time Shooter 1", path: "Time Shooter 1.html", type: "Shooter", image: "Time Shooter 1.png" },
    { name: "Time Shooter 2", path: "cltimeshooter2.html", type: "Shooter", image: "cltimeshooter2.png" },
    { name: "The Legend of Zelda Ocarina of Time", path: "The Legend of Zelda Ocarina of Time.html", type: "Shooter", image: "The Legend of Zelda Ocarina of Time.png" },
    { name: "The Legend of Zelda Majora's Mask", path: "The Legend of Zelda Majora's Mask.html", type: "Shooter", image: "The Legend of Zelda Majora's Mask.png" },
    { name: "Tetris", path: "cltetris.html", type: "Puzzle", image: "cltetris.jpg" },
    { name: "Traffic Rider", path: "Traffic Rider.html", type: "Puzzle", image: "Traffic Rider.png" },
    { name: "The Backrooms", path: "clbackrooms.html", type: "Horror", image: "clbackrooms.png" },
    { name: "The Classroom", path: "cltheclassroom.html", type: "Horror", image: "cltheclassroom.png" },
    { name: "Throw a Potato", path: "clthrowapotato.html", type: "Arcade", image: "clthrowapotato.png" },
    { name: "Traffic Jam 3D", path: "cltrafficjam3d.html", type: "Racing", image: "cltrafficjam3d.png" },
    { name: "Time Shooter 3", path: "cltimeshooter3.html", type: "Shooter", image: "cltimeshooter3.png" },
    { name: "Tomb Of The Mask", path: "cltotm.html", type: "Arcade", image: "cltotm.png" },
    { name: "Tower Blocks", path: "cltowerblocks.html", type: "Physics", image: "cltowerblocks.png" },
    { name: "The World's Hardest Game", path: "The World's Hardest Game.html", type: "Simulation", image: "The World's Hardest Game.png" },
    { name: "The World's Hardest Game 3", path: "The World's Hardest Game 3.html", type: "Simulation", image: "The World's Hardest Game 3.png" },
    { name: "The World's Hardest Game 4", path: "The World's Hardest Game 4.html", type: "Simulation", image: "The World's Hardest Game 4.png" },
    { name: "Truck Simulator", path: "cltrucksim.html", type: "Simulation", image: "cltrucksim.png" },
    { name: "Ultimate Car Driving Simulator", path: "clUltimatecardrivingsimulator.html", type: "Racing", image: "clUltimatecardrivingsimulator.png" },
    { name: "Uno", path: "cluno.html", type: "Card Game", image: "cluno.png" },
    { name: "ULTRAKILL", path: "ULTRAKILL.html", type: "Card Game", image: "ULTRAKILL.png" },
    { name: "Unicycle Hero", path: "clunicyclehero.html", type: "Sports", image: "clunicyclehero.png" },
    { name: "Vex", path: "clvex.html", type: "Platformer", image: "clvex.png" },
    { name: "Vex 2", path: "clvex2.html", type: "Platformer", image: "clvex2.png" },
    { name: "Vex 3", path: "clvex3.html", type: "Platformer", image: "clvex3.png" },
    { name: "Vex 4", path: "clvex4.html", type: "Platformer", image: "clvex4.png" },
    { name: "Vex 5", path: "clvex5.html", type: "Platformer", image: "clvex5.png" },
    { name: "Vex 6", path: "clvex6.html", type: "Platformer", image: "clvex6.png" },
    { name: "Vex 7", path: "clvex7.html", type: "Platformer", image: "clvex7.png" },
    { name: "Vex 8", path: "clvex8.html", type: "Platformer", image: "clvex8.png" },
    { name: "Vex Challenges", path: "clvexchallenges.html", type: "Platformer", image: "clvexchallenges.png" },
    { name: "Vex X3 M", path: "clvexx3m.html", type: "Racing", image: "clvexx3m.png" },
    { name: "Vex X3 M2", path: "clvexx3m2.html", type: "Racing", image: "clvexx3m2.png" },
    { name: "Volley Random", path: "clvolleyrandom.html", type: "Sports", image: "clvolleyrandom.png" },
    { name: "War the Knights", path: "clwartheknight.html", type: "Action", image: "clwartheknight.jpg" },
    { name: "Wave Dash", path: "clwavedash.html", type: "Rhythm", image: "clwavedash.png" },
    { name: "Wave Road 3D", path: "clwaveroad3d.html", type: "Runner", image: "clwaveroad3d.png" },
    { name: "Wave Run", path: "clwaverun.html", type: "Rhythm", image: "clwaverun.png" },
    { name: "We Become What We Behold", path: "clwebecomewhatwebehold.html", type: "Indie", image: "clwbwwb.png" },
    { name: "Webfishing", path: "clwebfishing.html", type: "Simulation", image: "clwebfishing.png" },
    { name: "Wermhole", path: "clwermhole.html", type: "Arcade", image: "clwermhole.png" },
    { name: "Wheelie Bike", path: "clwheeliebike.html", type: "Racing", image: "clwheeliebike.png" },
    { name: "World Cup 98", path: "clworldcup98.html", type: "Sports", image: "clworldcup98.png" },
    { name: "Wrestle Bros", path: "clwrestlebros.html", type: "Sports", image: "clwrestlebro.png" },
    { name: "Zombie Road", path: "clzombieroad.html", type: "Racing", image: "clzombieroad.png" },
    { name: "Zombie Rush", path: "clzombierush.html", type: "Action", image: "clzombierush.png" }
];

function getFavorites() {
    try {
        const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error retrieving favorites from localStorage:", e);
        return [];
    }
}

function saveFavorites(favorites) {
    try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
        console.error("Error saving favorites to localStorage:", e);
    }
}

window.toggleFavorite = function(gamePath) { 
    const favorites = getFavorites();
    const index = favorites.indexOf(gamePath);
    let isFavoritedAfter = false;

    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(gamePath);
        isFavoritedAfter = true;
    }

    saveFavorites(favorites);
    updateFavoritesCount(); 

    const cards = document.querySelectorAll('.game-card');
    cards.forEach(card => {
        const gameLink = card.getAttribute('onclick');
        if (gameLink && gameLink.includes(gamePath)) {
            const button = card.querySelector('button');
            if (button) {
                if (isFavoritedAfter) {
                    button.classList.remove('text-slate-400/90', 'bg-slate-900/60', 'hover:text-yellow-400');
                    button.classList.add('text-yellow-400', 'bg-slate-900/80');
                    button.setAttribute('title', 'Unfavorite Game');
                } else {
                    button.classList.remove('text-yellow-400', 'bg-slate-900/80');
                    button.classList.add('text-slate-400/90', 'bg-slate-900/60', 'hover:text-yellow-400');
                    button.setAttribute('title', 'Favorite Game');
                }
            }
        }
    });
};


window.updateFavoritesCount = function() { 
    const countSpan = document.getElementById('favoritesCount');
    if (countSpan) {
        countSpan.textContent = getFavorites().length;
    }
}



function getGameImage(path) {
    const game = GAMES.find(g => g.path === path);
    if (!game || !game.image) return '';

    let imageUrl;
    if (game.image.startsWith('http')) {
        imageUrl = game.image;
    } else {
        imageUrl = `${CDN_BASE_URL}${game.image}`;
    }
    return imageUrl;
}


window.toggleFullscreen = function() {
    const wrapper = document.getElementById('game-frame-wrapper');
    if (!wrapper) return;

    if (!document.fullscreenElement) {
        if (wrapper.requestFullscreen) {
            wrapper.requestFullscreen();
        } else if (wrapper.webkitRequestFullscreen) { 
            wrapper.webkitRequestFullscreen();
        } else if (wrapper.msRequestFullscreen) { 
            wrapper.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { 
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { 
            wrapper.msRequestFullscreen();
        }
    }
};


window.closeGameEmbed = function() {
    const container = document.getElementById('game-embed-container');
    const gameFrameWrapper = document.getElementById('game-frame-wrapper');
    const gameGrid = document.getElementById('gameGrid');
    const paginationContainer = document.getElementById('pagination');
    const searchInput = document.getElementById('searchInput'); 
    const catalogContainer = document.getElementById('catalogDropdownContainer'); 
    const gameWindow = document.getElementById('game-window');

    if (container) {
        if (gameFrameWrapper) {
            gameFrameWrapper.innerHTML = ''; 
        }
        container.style.display = 'none'; 
    }

    if (gameWindow) {
        gameWindow.classList.remove('zoom-in-effect');
    }

    if (gameGrid) {
        gameGrid.style.display = 'grid';
        window.scrollTo({ top: gameGrid.offsetTop, behavior: 'smooth' });
    }
    if (paginationContainer) {
        paginationContainer.style.display = 'flex';
    }
    if (searchInput) {
        searchInput.parentElement.style.display = 'block'; 
    }
    if (catalogContainer) { 
        catalogContainer.style.display = 'flex';
    }
};

window.openGameInNewWindow = function() {
    if (typeof lastLaunchedGame === 'undefined' || !lastLaunchedGame.link) {
        alert("Error: Game link is missing. Please close and relaunch the game.");
        return;
    }
    const gameLink = lastLaunchedGame.link;
    const gameName = lastLaunchedGame.name;

    window.closeGameEmbed();

    const windowTitle = `${gameName}`;

    fetch(gameLink)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch game content: HTTP status ${response.status}`);
            }
            return response.text();
        })
        .then(htmlContent => {
            const newWindow = window.open('about:blank', '_blank');

            if (newWindow) {
                const desktopContent = htmlContent.replace(
                    /<meta\s+name=["']viewport["']\s+content=["'][^"']*["']/i, 
                    '<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes"'
                );

                const aggressiveStyle = `
                    <style>
                        html, body {
                        overflow: auto !important;
                        }
                    </style>
                `;
                let finalContent = desktopContent.replace(/<\/head>/i, `${aggressiveStyle}</head>`);

                newWindow.document.open();
                newWindow.document.write(finalContent);
                newWindow.document.close();
                newWindow.document.title = windowTitle;
            } else {
                console.error("Popup blocker prevented game launch. Opening direct link instead.");
                window.open(gameLink, '_blank'); 
            }
        })
        .catch(error => {
            console.error("Error loading game into new window:", error);
            alert("Error: Failed to load game content into new window.");
        });
}


window.playGameTransition = function(gameLink, name, windowTitle) {
    const embedContainer = document.getElementById('game-embed-container');
    const gameFrameWrapper = document.getElementById('game-frame-wrapper');
    const gameWindow = document.getElementById('game-window'); 
    if (!embedContainer || !gameFrameWrapper || !gameWindow) {
        console.error("Critical Error: Required embed elements for transition not found.");
        return;
    }


    const playNowScreen = document.getElementById('play-now-screen');

    if (playNowScreen) {
        playNowScreen.style.opacity = '0';
        playNowScreen.style.pointerEvents = 'none';
        gameFrameWrapper.style.backgroundColor = 'transparent'; 
    }

    gameWindow.classList.add('zoom-in-effect'); 

    setTimeout(async () => {

        gameWindow.classList.remove('zoom-in-effect');


        if (typeof lastLaunchedGame !== 'undefined') {
            lastLaunchedGame.link = gameLink;
            lastLaunchedGame.name = name;
        }
        let gameProgress = null;
        try {
            gameProgress = await window.loadGameProgressFromCloud(name);
            console.log('Loaded game progress:', gameProgress);
        } catch (err) {
            console.warn('Could not load game progress:', err);
        }

        const iframe = document.createElement('iframe');
        iframe.src = 'about:blank'; 
        iframe.id = 'embedded-game-iframe';
        iframe.title = windowTitle;

        iframe.allowFullscreen = true;      
        iframe.allow = 'accelerometer; gyroscope; fullscreen; camera; microphone; gamepads; autoplay; clipboard-read; clipboard-write';
        iframe.style.width = '100%';
        iframe.style.height = '100%';      
        iframe.style.border = 'none';

        gameFrameWrapper.innerHTML = ''; 
        gameFrameWrapper.appendChild(iframe);

        fetch(gameLink)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch game content: HTTP status ${response.status}`);
                }
                return response.text();
            })
            .then(htmlContent => {

                let finalContent = htmlContent.replace(
                    /<meta\s+name=["']viewport["']\s+content=["'][^"']*["']/i,
                    '<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes"'
                );

                const progressScript = gameProgress ? `
                    <script>
                    // Restore game progress from parent window
                    (function() {
                        try {
                            const progressData = ${JSON.stringify(gameProgress)};
                            if (progressData) {
                                localStorage.setItem('${name.replace(/'/g, "\\'")}', JSON.stringify(progressData));
                                console.log('Restored game progress in iframe');
                            }
                        } catch(e) {
                            console.warn('Could not restore progress:', e);
                        }
                    })();
                    </script>
                ` : '';

                const aggressiveStyle = `
                    <style>
                        html, body {
                        overflow: hidden !important;
                        }
                    </style>
                `;

                finalContent = finalContent.replace(/<\/head>/i, `${progressScript}${aggressiveStyle}</head>`);

                const iframeDoc = iframe.contentWindow.document;
                iframeDoc.open();
                iframeDoc.write(finalContent);
                iframeDoc.close();
                iframeDoc.title = windowTitle;

                window.scrollTo({ top: embedContainer.offsetTop, behavior: 'smooth' });

            })
            .catch(error => {
                console.error("Error loading game content via injection:", error);
                alert("Error: Failed to load game content. This may be due to network issues or restrictive file hosting.");
                window.closeGameEmbed();
            });

    }, 400); 
}


window.openGame = function(path, name) {
    const gameLink = `${CDN_BASE_URL}${path}`;
    const windowTitle = `${name} | Delta V9 Game`;

    const gameInfo = GAMES.find(g => g.name === name);
    let imageUrl = '';
    if (gameInfo && gameInfo.image) {
        if (gameInfo.image.startsWith('http')) {
            imageUrl = gameInfo.image;
        } else {
            imageUrl = `${CDN_BASE_URL}${gameInfo.image}`;
        }
    }
    const placeholderUrl = `https://placehold.co/1280x720/1e293b/06b6d4?text=GAME+LOADING...`;
    const finalImageUrl = imageUrl || placeholderUrl;

    const embedContainer = document.getElementById('game-embed-container');
    const gameFrameWrapper = document.getElementById('game-frame-wrapper');
    const gameGrid = document.getElementById('gameGrid');
    const paginationContainer = document.getElementById('pagination');
    const searchInput = document.getElementById('searchInput');    
    const catalogContainer = document.getElementById('catalogDropdownContainer'); 
    const gameTitleDisplay = document.getElementById('game-title-display');
    const gameWindow = document.getElementById('game-window'); 

    if (!embedContainer || !gameFrameWrapper || !gameWindow) {
        console.error("Critical Error: Required game embed elements not found. Check HTML structure.");
        alert("Error: Game embed container not found. Check HTML structure.");
        return;
    }

    gameFrameWrapper.innerHTML = '';
    embedContainer.style.display = 'flex';

    if (gameGrid) gameGrid.style.display = 'none';
    if (paginationContainer) paginationContainer.style.display = 'none';
    if (searchInput) searchInput.parentElement.style.display = 'none';
    if (catalogContainer) catalogContainer.style.display = 'none'; 
    if (gameTitleDisplay) gameTitleDisplay.textContent = name;

    if (typeof lastLaunchedGame !== 'undefined') {
        lastLaunchedGame.link = gameLink;
        lastLaunchedGame.name = name;
    }

    const safeLink = gameLink.replace(/'/g, "\\'");
    const safeName = name.replace(/'/g, "\\'");
    const safeTitle = windowTitle.replace(/'/g, "\\'");

    const playNowHtml = `
        <div id="play-now-screen" class="absolute inset-0 flex flex-col items-center justify-center 
            transition-opacity duration-300"
            style="opacity: 1; z-index: 10;"> 

            <img id="game-transition-image" src="${finalImageUrl}" 
                 alt="${name} Background" 
                 class="absolute inset-0 w-full h-full object-cover 
                        filter blur-lg brightness-[.4] 
                        transition-transform duration-500 ease-out"
                 style="transform: scale(1.05);"/> 

            <div class="flex flex-col items-center justify-center relative w-full h-full" style="z-index: 30;">

                <button onclick="playGameTransition('${safeLink}', '${safeName}', '${safeTitle}')"
                    class="flex flex-col items-center justify-center space-y-3 p-6 rounded-3xl text-white 
                    glass-button shadow-2xl neon-glow-button hover:scale-105 transition duration-200"
                    style="min-width: 200px;">

                    <div class="w-24 h-24 rounded-lg overflow-hidden border-2 border-white/50 shadow-xl">
                        <img src="${finalImageUrl}" 
                             onerror="this.onerror=null; this.src='https://placehold.co/96x96/0f172a/94a3b8?text=NO+IMG';"
                             alt="${name} Thumbnail"
                             class="w-full h-full object-cover">
                    </div>

                    <span class="text-3xl font-extrabold tracking-wide">Play Now</span>
                </button>
            </div>
        </div>
        <style>
            .glass-button {
                background-color: rgba(255, 255, 255, 0.1); 
                backdrop-filter: blur(15px); 
                -webkit-backdrop-filter: blur(15px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .neon-glow-button {
                box-shadow: 0 0 15px var(--color-accent-shadow);
            }
            #game-transition-image {
                 filter: blur(8px) brightness(0.4); 
            }
        </style>
    `;

    gameFrameWrapper.innerHTML = playNowHtml;

    try {
        populateSimilarMiniBar(name);
        ensureSimilarBarObserver();
    } catch (err) {
        console.error('Error preparing similar mini bar:', err);
    }

    window.scrollTo({ top: embedContainer.offsetTop, behavior: 'smooth' });
};



function addTiltEffect(card) {
    const maxTilt = 12;
    const scaleFactor = 1.05;

    card.style.transition = 'transform 0.15s ease-out, box-shadow 0.15s ease-out, border-color 0.15s ease-out';
    card.style.willChange = 'transform, box-shadow';
    card.style.transformOrigin = 'center';

    const getAccentColor = () => getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
    const getAccentShadow = () => getComputedStyle(document.documentElement).getPropertyValue('--color-accent-shadow').trim();

    card.addEventListener('mousemove', (e) => {
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;

        const xPos = (e.clientX - centerX) / (cardRect.width / 2);
        const yPos = (e.clientY - centerY) / (cardRect.height / 2);

        const rotY = xPos * maxTilt;
        const rotX = yPos * maxTilt * -1; 

        card.style.transform = `scale(${scaleFactor}) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(30px)`; 

        const imgWrapper = card.querySelector('.game-card-image-wrapper');
        if (imgWrapper) {
            imgWrapper.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        }

        const accentColor = getAccentColor();
        const accentShadow = getAccentShadow();
        card.style.boxShadow = `0 0 40px 15px ${accentShadow}, 0 0 80px 10px ${accentShadow}`;
        card.style.borderColor = accentColor;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = `scale(1) rotateX(0deg) rotateY(0deg) translateZ(0)`;

        const accentShadow = getAccentShadow();
        card.style.boxShadow = `0 0 10px rgba(0, 0, 0, 0.5), 0 0 3px ${accentShadow}`;
        card.style.borderColor = 'rgb(71 85 105)';

        const imgWrapper = card.querySelector('.game-card-image-wrapper');
        if (imgWrapper) {
            imgWrapper.style.backgroundColor = 'transparent'; 
        }
    });

    const accentShadow = getAccentShadow();
    card.style.boxShadow = `0 0 10px rgba(0, 0, 0, 0.5), 0 0 3px ${accentShadow}`;
    card.style.transform = 'translateZ(0)';
}

function renderPagination(games) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';
    let pagesHtml = '';

    if (window.paginationMode === 'pages') {
        const totalPages = Math.ceil(games.length / GAMES_PER_PAGE);
        if (totalPages <= 1) return;

        pagesHtml += `<button onclick="changePage(${window.currentPage - 1})"
            ${window.currentPage === 1 ? 'disabled' : ''}
            class="px-4 py-2 rounded-lg text-slate-400 bg-slate-900/30 border border-slate-700/50
            ${window.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-baby-blue/70 hover:text-white transition duration-150'}">
            &laquo; Previous
        </button>`;

        const maxButtons = 5;
        let startPage = Math.max(1, window.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === window.currentPage;
            pagesHtml += `<button onclick="changePage(${i})"
                class="px-4 py-2 rounded-lg font-bold
                ${isActive ? 'bg-baby-blue text-dark-navy' : 'bg-slate-900/30 text-baby-blue border border-slate-700/50 hover:bg-baby-blue/70 hover:text-white transition duration-150'}">
                ${i}
            </button>`;
        }

        pagesHtml += `<button onclick="changePage(${window.currentPage + 1})"
            ${window.currentPage === totalPages ? 'disabled' : ''}
            class="px-4 py-2 rounded-lg text-slate-400 bg-slate-900/30 border border-slate-700/50
            ${window.currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-baby-blue/70 hover:text-white transition duration-150'}">
            Next &raquo;
        </button>`;
    } else {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');
        const fnfGames = games.filter(g => g.name.startsWith('FNF '));

        letters.forEach((letter, idx) => {
            const hasGames = games.some(game => {
                if (game.name.startsWith('FNF ')) return false;
                const gameFirstChar = game.name.charAt(0).toUpperCase();
                return letter === '#' ? !isNaN(gameFirstChar) : gameFirstChar === letter;
            });

            if (!hasGames) return;

            const isActive = letter === window.currentLetter;
            pagesHtml += `<button onclick="changePage('${letter}')"
                class="px-3 py-2 rounded-lg font-bold text-sm
                ${isActive ? 'bg-baby-blue text-dark-navy' : 'bg-slate-900/30 text-baby-blue border border-slate-700/50 hover:bg-baby-blue/70 hover:text-white transition duration-150'}">
                ${letter}
            </button>`;

            if (letter === 'F' && fnfGames.length > 0) {
                const isFnfActive = window.currentLetter === 'FNF';
                pagesHtml += `<button onclick="changePage('FNF')"
                    class="px-3 py-2 rounded-lg font-bold text-sm
                    ${isFnfActive ? 'bg-baby-blue text-dark-navy' : 'bg-slate-900/30 text-baby-blue border border-slate-700/50 hover:bg-baby-blue/70 hover:text-white transition duration-150'}">
                    FNF
                </button>`;
            }
        });
    }

    paginationContainer.innerHTML = pagesHtml;
    if (window.paginationMode === 'letters') {
        paginationContainer.style.position = 'fixed';
        paginationContainer.style.bottom = '20px';
        paginationContainer.style.left = '50%';
        paginationContainer.style.transform = 'translateX(-50%)';
        paginationContainer.style.zIndex = '100';
    } else {
        paginationContainer.style.position = 'relative';
        paginationContainer.style.bottom = 'auto';
        paginationContainer.style.transform = 'none';
    }
}


function renderGames() {
    initTiltEffect();
    const gameGrid = document.getElementById('gameGrid');
    if (!gameGrid) {
        console.error("Critical Error: 'gameGrid' element not found. Check your HTML ID.");
        return;
    }

    const embedContainer = document.getElementById('game-embed-container');
    if (embedContainer && embedContainer.style.display !== 'none') {
        return;
    }

    gameGrid.innerHTML = '';

    let gamesSource = [];
    let isFavoritesView = currentView === 'favorites'; 

    if (isFavoritesView) {
        const favoritesPaths = getFavorites();
        gamesSource = GAMES.filter(game => favoritesPaths.includes(game.path));
    } else {
        gamesSource = currentFilteredGames;
    }

    let gamesToRender = [];

    if (window.paginationMode === 'letters') {
        if (window.currentLetter === 'FNF') {
            gamesToRender = gamesSource.filter(g => g.name.startsWith('FNF '));
        } else {
            gamesToRender = gamesSource.filter(game => {
                if (game.name.startsWith('FNF ')) return false;
                const gameFirstChar = game.name.charAt(0).toUpperCase();
                return window.currentLetter === '#' ? !isNaN(gameFirstChar) : gameFirstChar === window.currentLetter;
            });
        }
    } else {
        const startIndex = (window.currentPage - 1) * GAMES_PER_PAGE;
        const endIndex = startIndex + GAMES_PER_PAGE;
        gamesToRender = gamesSource.slice(startIndex, endIndex);
    }

    if (gamesToRender.length === 0) {
        let noResultsText;
        if (isFavoritesView) {
            noResultsText = `You haven't added any games to your favorites yet. Click the <span class="text-yellow-400">⭐</span> on a game card to add it!`;
        } else {
            const query = document.getElementById('searchInput').value;
            const typeText = currentFilterType === 'All Games' ? '' : ` in ${currentFilterType}`;
            noResultsText = query
                ? `No games matched your search query "${query}"${typeText}.`
                : `No games found in the **${currentFilterType}** catalog.`;
        }

        gameGrid.innerHTML = `<p class="col-span-full text-center text-xl text-slate-500 p-8">${noResultsText}</p>`;
        renderPagination([]);
        return;
    }


    const html = gamesToRender.map((game, index) => { 
        if (!game || !game.name || !game.path || !game.image) return '';

        const baseImageUrl = game.image;
        let imageUrl;

        if (baseImageUrl.startsWith('http')) {
            imageUrl = baseImageUrl;
        } else {
            imageUrl = `${CDN_BASE_URL}${baseImageUrl}`;
        }

        const placeholderUrl = `https://placehold.co/400x160/1e293b/06b6d4?text=${game.name.replace(/\s/g, '+')}`;

        const safePath = game.path.replace(/'/g, "\\'");
        const safeName = game.name.replace(/'/g, "\\'");

        const isFavorited = getFavorites().includes(game.path);

        const favoriteButtonHtml = `
            <button onclick="event.stopPropagation(); toggleFavorite('${safePath}')"
                    title="${isFavorited ? 'Unfavorite Game' : 'Favorite Game'}"
                    class="absolute top-2 right-2 p-1.5 rounded-full z-30 transition duration-150 transform-gpu
                           ${isFavorited ? 'text-yellow-400 bg-slate-900/80 hover:scale-110 shadow-lg' : 'text-slate-400/90 bg-slate-900/60 hover:text-yellow-400 hover:scale-110'}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                    <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
                </svg>
            </button>
        `;

        const cardId = `game-card-${index}`;

        return `
        <div class="game-card relative group cursor-pointer rounded-xl overflow-hidden border border-slate-700/50 bg-slate-800/40 transition-all duration-300" onclick="openGame('${safePath}', '${safeName}')">
                
                <div class="absolute top-2 left-2 z-30">
                    <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-baby-blue/80 backdrop-blur-md rounded-md border border-white/20">
                        ${game.type}
                    </span>
                </div>

                ${favoriteButtonHtml}

                <div class="game-card-image-wrapper aspect-video w-full overflow-hidden">
                    <img src="${imageUrl}" 
                        onerror="this.src='${placeholderUrl}'" 
                        alt="${game.name}" 
                        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                </div>
                
                <div class="p-3">
                    <h3 class="text-sm font-semibold text-slate-200 truncate">${game.name}</h3>
                </div>
            </div>
        `;
    }).join('');

    gameGrid.innerHTML = html;

    if (typeof applyGameCardSize === 'function') {
        applyGameCardSize();
    }

    document.querySelectorAll('.game-card').forEach(card => {
        addTiltEffect(card);
    });

    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const gridElement = card.parentElement;
                const cards = Array.from(gridElement.children);
                const cardIndex = cards.indexOf(card);
                
                const gridStyle = window.getComputedStyle(gridElement);
                const gridTemplateColumns = gridStyle.gridTemplateColumns;
                const columnCount = gridTemplateColumns.split(' ').length;

                const cardRow = Math.floor(cardIndex / columnCount);
                const cardColumn = cardIndex % columnCount;

                const animationDelay = (cardRow + cardColumn) * 0.15;
                card.style.animationDelay = `${animationDelay}s`;
                card.classList.add('loaded');
                cardObserver.unobserve(card);
            }
        });
    }, { threshold: 0.05, rootMargin: '50px' });

    document.querySelectorAll('.game-card').forEach(card => {
        cardObserver.observe(card);
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = `${index * 0.05}s`;
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05 });

    document.querySelectorAll('.game-card-perspective-container').forEach(container => {
        observer.observe(container);
    });

    renderPagination(gamesSource);
    updateGameCounter(gamesSource);
}

function updateGameCounter(gamesSource) {
    const counterElement = document.getElementById('gameCounter');
    if (!counterElement) return;
    
    let countToDisplay = 0;
    
    if (currentView === 'favorites') {
        const favoritesPaths = getFavorites();
        countToDisplay = favoritesPaths.length;
    } else {
        countToDisplay = gamesSource ? gamesSource.length : GAMES.length;
    }
    
    counterElement.textContent = countToDisplay;
}


window.changePage = function(pageOrLetter) {
    if (window.paginationMode === 'letters') {
        window.currentLetter = pageOrLetter;
        localStorage.setItem('deltaV10_currentLetter', pageOrLetter);
    } else {
        window.currentPage = pageOrLetter;
        localStorage.setItem('deltaV10_currentPage', pageOrLetter);
    }
    renderGames();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}



window.filterGames = function(query, type = currentFilterType) {
    if (currentView === 'favorites' || currentFilterType !== type) {
        switchView('catalog', false); 
    }
    const safeQuery = query ? String(query) : "";
    const lowerCaseQuery = safeQuery.toLowerCase();
    
    currentFilterType = type; 
    let gamesToSearch = GAMES;
    
    if (currentFilterType !== 'All Games') {
        gamesToSearch = GAMES.filter(game => game.type === currentFilterType);
    }
    
    currentFilteredGames = gamesToSearch.filter(game => {
        if (!game || !game.name) return false;
        const isFNF = game.name.startsWith("FNF") || game.name === "Friday Night Funkin";
        if (!window.showFNF && isFNF) {
            return false;
        }

        return game.name.toLowerCase().includes(lowerCaseQuery) ||
               (game.type && game.type.toLowerCase().includes(lowerCaseQuery));
    });

    const dropdownButton = document.getElementById('catalogDropdownButton');
    if (dropdownButton) {
        dropdownButton.textContent = currentFilterType === 'All Games' ? 'Catalog: All Games' : `Catalog: ${currentFilterType}`;
        dropdownButton.classList.remove('active'); 
    }
    
    window.currentLetter = 'A';
    window.currentPage = 1;
    renderGames();
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value !== safeQuery) {
        searchInput.value = safeQuery; 
    }
    updateFilterButtonVisuals();
}


window.switchView = function(viewName, shouldRender = true) { 
    if (currentView === viewName && shouldRender) return; 

    currentView = viewName;
    window.currentLetter = 'A'; 

    if (viewName === 'favorites') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        currentFilterType = 'All Games'; 
    }

    updateFilterButtonVisuals();

    if (shouldRender) {
        renderGames();
        if (viewName === 'favorites') {
            const favoritesPaths = getFavorites();
            updateGameCounter(favoritesPaths.map(path => GAMES.find(g => g.path === path)).filter(Boolean));
        }
    }
}


function updateFilterButtonVisuals() { 
    const starBtn = document.getElementById('favoritesStarBtn');
    const arrowBtn = document.getElementById('catalogDropdownArrow');

    if (starBtn) {
        if (currentView === 'favorites') {
            starBtn.querySelector('i').classList.add('text-yellow-300');
            starBtn.classList.add('bg-baby-blue/20');
        } else {
            starBtn.querySelector('i').classList.remove('text-yellow-300');
            starBtn.classList.remove('bg-baby-blue/20');
        }
    }

    if (arrowBtn) {
        arrowBtn.classList.toggle('text-baby-blue', currentView === 'catalog');
    }
}



window.toggleFavoritesView = function() {
    if (currentView === 'favorites') {
        switchView('catalog', true);
    } else {
        switchView('favorites', true);
    }
}


window.toggleCatalogDropdown = function() { 
    const dropdownMenu = document.getElementById('catalogDropdownMenu');
    const arrowBtn = document.getElementById('catalogDropdownArrow');
    if (!dropdownMenu || !arrowBtn) return;

    if (currentView === 'favorites') {
        switchView('catalog', true);
    }

    const isHidden = dropdownMenu.classList.contains('hidden');
    if (isHidden) {
        dropdownMenu.classList.remove('hidden');
        setTimeout(() => {
             document.addEventListener('click', closeDropdownOnOutsideClick);
        }, 10);
    } else {
        dropdownMenu.classList.add('hidden');
        document.removeEventListener('click', closeDropdownOnOutsideClick);
    }
}


function closeDropdownOnOutsideClick(event) { 
    const dropdownContainer = document.getElementById('catalogDropdownContainer');
    const dropdownMenu = document.getElementById('catalogDropdownMenu');
    const arrowBtn = document.getElementById('catalogDropdownArrow');

    if (dropdownContainer && !dropdownContainer.contains(event.target) && !arrowBtn.contains(event.target)) {
        if (dropdownMenu) dropdownMenu.classList.add('hidden');
        document.removeEventListener('click', closeDropdownOnOutsideClick);
    }
}

function renderFilterButtons() {  
    const uniqueTypes = [...new Set(GAMES.map(game => game.type))].sort();

    let menuItems = `<a href="#" onclick="filterGames(document.getElementById('searchInput').value, 'All Games'); toggleCatalogDropdown(); return false;"
                       class="block px-4 py-2 text-sm text-white/90 hover:bg-baby-blue/50 transition duration-150">All Games</a>`;

    uniqueTypes.forEach(type => {
        const safeType = type.replace(/'/g, "\\'");
        menuItems += `<a href="#" onclick="filterGames(document.getElementById('searchInput').value, '${safeType}'); toggleCatalogDropdown(); return false;"
                         class="block px-4 py-2 text-sm text-white/90 hover:bg-baby-blue/50 transition duration-150">${type}</a>`;
    });

    let dropdownWrapper = document.getElementById('catalogDropdownWrapper');
    if (!dropdownWrapper) {
        dropdownWrapper = document.createElement('div');
        dropdownWrapper.id = 'catalogDropdownWrapper';
        document.body.appendChild(dropdownWrapper);
    }

    dropdownWrapper.innerHTML = `
        <div id="catalogDropdownMenu" class="hidden fixed rounded-xl shadow-2xl bg-slate-900 ring-1 ring-white ring-opacity-10" style="z-index: 999999;" role="menu" aria-orientation="vertical">
            <div class="py-1 w-56" role="none">
                ${menuItems}
            </div>
        </div>
    `;

    const arrowBtn = document.getElementById('catalogDropdownArrow');
    if (arrowBtn) {
        const rect = arrowBtn.getBoundingClientRect();
        const dropdownMenu = document.getElementById('catalogDropdownMenu');
        if (dropdownMenu) {
            dropdownMenu.style.top = (rect.bottom + 8) + 'px';
            dropdownMenu.style.right = (window.innerWidth - rect.right) + 'px';
        }
    }
}


function injectGameHighlightElement() {
    const highlightHtml = `
        <div id="game-highlight-follower" class="absolute w-40 h-40 rounded-full bg-baby-blue/20 blur-2xl pointer-events-none" 
             style="opacity: 0; transition: opacity 0.3s ease-out; z-index: 10;"></div>
    `;
    document.body.insertAdjacentHTML('afterbegin', highlightHtml);
}


function setupGameCardHighlight() {
    const gameGrid = document.getElementById('gameGrid');
    const follower = document.getElementById('game-highlight-follower');

    if (!gameGrid || !follower) return;

    let currentCard = null;

    gameGrid.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.game-card');

        if (card) {
            currentCard = card;
            follower.style.opacity = '1';
        } else {
            currentCard = null;
            follower.style.opacity = '0';
        }
    });

    gameGrid.addEventListener('mousemove', (e) => {
        if (!currentCard) return;

        const mouseX = e.clientX;
        const mouseY = e.clientY;

        const cardRect = currentCard.getBoundingClientRect();


        follower.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    });

    gameGrid.addEventListener('mouseleave', () => {
        currentCard = null;
        follower.style.opacity = '0';
    });
}


function injectGlobalStyles() {
    if (document.getElementById('global-game-styles')) return;

    const style = document.createElement('style');
    style.id = 'global-game-styles';
    style.innerHTML = `
        @keyframes slideInFromTop {
            0% {
                opacity: 0;
                transform: translateY(-50px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .game-card-perspective-container {
            perspective: 1000px;
            opacity: 0;
        }
        .game-card-perspective-container.visible {
            animation: slideInFromTop 0.8s ease-out forwards;
        }

        .game-card-animated {
            opacity: 1;
        }

        .game-card {
            transform-style: preserve-3d;
            background-color: transparent !important; 
        }

        .active-view-button {
            background-color: var(--color-accent) !important;
            color: var(--color-background) !important;
            border-color: var(--color-accent) !important;
            box-shadow: 0 0 10px var(--color-accent-shadow);
        }

        #new-window-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start; 
            background-color: var(--color-accent);
            color: var(--color-background);
            border: none;
            border-radius: 0.5rem; 
            padding: 0;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            position: relative; 
            overflow: hidden;
            width: 100%;
            height: 100%;
            min-width: 150px;
        }

        #new-window-button:hover {
            filter: brightness(0.85);
            transform: scale(1.02);
            box-shadow: 0 0 20px var(--color-accent-shadow);
        }

        #new-window-image {
            width: 100%;
            height: 75%;
            background-color: #1e293b;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            border-bottom: 2px solid var(--color-accent);
            position: relative;
            z-index: 2; 
        }

        .game-embed-button-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .new-window-button-label {
            padding: 0.5rem;
            font-weight: bold;
            font-size: 1rem;
            width: 100%;
            text-align: center;
            background-color: inherit;
            position: relative;
            z-index: 3;
        }
    `;
    document.head.appendChild(style);
}


window.initGameGrid = function() {
    injectGlobalStyles();
    const fnfBtn = document.getElementById('fnfToggleBtn');
    if (fnfBtn) {
        if (window.showFNF) {
            fnfBtn.textContent = "Hide FNF";
            fnfBtn.classList.remove('text-slate-500', 'line-through');
            fnfBtn.classList.add('text-baby-blue');
        } else {
            fnfBtn.textContent = "Show FNF";
            fnfBtn.classList.remove('text-slate-500', 'line-through');
            fnfBtn.classList.add('text-baby-blue');
        }
    }
    
    if (typeof window.applyCurrentPaginationMode === 'function') {
        window.applyCurrentPaginationMode();
    }

    const savedLetter = localStorage.getItem('deltaV10_currentLetter') || 'A';
    const savedPage = parseInt(localStorage.getItem('deltaV10_currentPage')) || 1;
    window.currentLetter = savedLetter;
    window.currentPage = savedPage;

    renderFilterButtons(); 
    updateFavoritesCount(); 
    if (CDN_BASE_URL.includes("ethanlb34/Delta-Games@main/")) {
        if (window.showFNF) {
            currentFilteredGames = GAMES;
        } else {
            currentFilteredGames = GAMES.filter(game => {
                const isFNF = game.name.startsWith("FNF") || game.name === "Friday Night Funkin";
                return !isFNF;
            });
        }
        
        currentFilterType = 'All Games'; 
        currentView = 'catalog'; 

        const gameGrid = document.getElementById('gameGrid');
        const embedContainer = document.getElementById('game-embed-container');
        const pagination = document.getElementById('pagination');
        const searchInput = document.getElementById('searchInput');
        const catalogContainer = document.getElementById('catalogDropdownContainer'); 

        if (gameGrid) gameGrid.style.display = 'grid';
        if (embedContainer) embedContainer.style.display = 'none';
        if (pagination) pagination.style.display = 'flex';
        if (searchInput) searchInput.parentElement.style.display = 'block';
        if (catalogContainer) catalogContainer.style.display = 'flex'; 

        renderGames();
        updateFilterButtonVisuals();
        updateGameCounter(currentFilteredGames);
        loadRecentlyPlayed();
        loadPopularGames(); 
        if (window.applyRecentlyPlayedSectionState) window.applyRecentlyPlayedSectionState();
        if (window.applyPopularGamesSectionState) window.applyPopularGamesSectionState();
    } else {
        const gameGrid = document.getElementById('gameGrid');
        if (gameGrid) {
             return;
        }
    }
};

function populateSimilarMiniBar(currentGameName) {
    const similarBar = document.getElementById('similar-mini-bar');
    const similarTrack = document.getElementById('similar-mini-bar-track');
    if (!similarBar || !similarTrack) return;

    const current = GAMES.find(g => g.name === currentGameName) || {};
    const type = current.type || null;
    if (!type) { similarBar.style.display = 'none'; return; }

    const similar = GAMES.filter(g => g.type === type && g.name !== currentGameName).slice(0, 12);
    if (!similar || similar.length === 0) { similarBar.style.display = 'none'; return; }

    similarTrack.innerHTML = '';
    similar.forEach(g => {
        const item = document.createElement('div');
        item.className = 'similar-mini-item';
        const img = document.createElement('img');
        img.src = g.image && g.image.startsWith('http') ? g.image : `${CDN_BASE_URL}${g.image}`;
        img.alt = g.name;
        item.appendChild(img);
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            openGame(g.path, g.name);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        similarTrack.appendChild(item);
    });

    similarBar.style.display = 'block';
}

let __similarBarObserverAttached = false;
function ensureSimilarBarObserver() {
    if (__similarBarObserverAttached) return;
    const toolbar = document.getElementById('game-toolbar');
    const similarBar = document.getElementById('similar-mini-bar');
    const gameWindow = document.getElementById('game-window');
    if (!toolbar || !similarBar || !gameWindow) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                similarBar.classList.add('similar-mini-bar-fixed');
                const rect = gameWindow.getBoundingClientRect();
                similarBar.style.width = rect.width + 'px';
            } else {
                similarBar.classList.remove('similar-mini-bar-fixed');
                similarBar.style.width = '';
            }
        });
    }, { threshold: 0.05 });

    observer.observe(toolbar);

    window.addEventListener('resize', () => {
        if (similarBar.classList.contains('similar-mini-bar-fixed')) {
            const rect = gameWindow.getBoundingClientRect();
            similarBar.style.width = rect.width + 'px';
        }
    });

    __similarBarObserverAttached = true;

    const bar = document.getElementById('similar-mini-bar');
    if (isSimilarBarCollapsed) {
        bar.classList.add('collapsed');
    }
}

let isSimilarBarCollapsed = false;

window.toggleSimilarGames = function() {
    const bar = document.getElementById('similar-mini-bar');
    const btn = document.getElementById('similar-toggle-btn');
    if (!bar || !btn) return;

    isSimilarBarCollapsed = bar.classList.toggle('collapsed');
    
    btn.innerHTML = isSimilarBarCollapsed 
        ? '<i class="fas fa-chevron-up mr-1"></i> Expand' // Why is it called a chevron? Just call it an arrow
        : '<i class="fas fa-chevron-down mr-1"></i> Hide';
};

const originalOpenGame = window.openGame;
window.openGame = function(...args) {
    const bar = document.getElementById('similar-mini-bar');
    if (bar) bar.classList.remove('collapsed');
    if (args.length >= 2) {
        addToRecentlyPlayed(args[1], args[0]);
        trackGamePlay(args[1]); 
    }
    if (originalOpenGame) originalOpenGame.apply(this, args);
};

function initTiltEffect() {
    const cards = document.querySelectorAll('.game-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; 
            const y = e.clientY - rect.top; 
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -15; 
            const rotateY = ((x - centerX) / centerX) * 15;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    });
}

const RECENTLY_PLAYED_KEY = 'delta_recently_played_games';
const MAX_RECENT_GAMES = 10;

function addToRecentlyPlayed(gameName, gamePath) {
    try {
        let recentlyPlayed = JSON.parse(localStorage.getItem(RECENTLY_PLAYED_KEY)) || [];
        
        recentlyPlayed = recentlyPlayed.filter(g => g.name !== gameName);
        
        const gameInfo = GAMES.find(g => g.name === gameName);
        const imageUrl = gameInfo?.image || 'https://placehold.co/140x140/1e293b/06b6d4?text=GAME';
        
        recentlyPlayed.unshift({
            name: gameName,
            path: gamePath,
            image: imageUrl,
            timestamp: Date.now()
        });
        
        recentlyPlayed = recentlyPlayed.slice(0, MAX_RECENT_GAMES);
        
        localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(recentlyPlayed));
        
        loadRecentlyPlayed();
    } catch (err) {
        console.warn('Error saving recently played game:', err);
    }
}

function loadRecentlyPlayed() {
    try {
        const recentlyPlayed = JSON.parse(localStorage.getItem(RECENTLY_PLAYED_KEY)) || [];
        const section = document.getElementById('recently-played-section');
        const track = document.getElementById('recently-played-track');
        
        if (!section || !track) return;
        
        if (recentlyPlayed.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        const recentlyPlayedEnabled = localStorage.getItem('recentlyPlayedEnabled') !== 'false';
        section.style.display = recentlyPlayedEnabled ? 'block' : 'none';
        
        track.innerHTML = '';
        
        recentlyPlayed.forEach(game => {
            const item = document.createElement('div');
            item.className = 'recently-played-item';
            item.onclick = () => openGame(game.path, game.name);
            
            const imageUrl = game.image.startsWith('http') 
                ? game.image 
                : `${CDN_BASE_URL}${game.image}`;
            
            item.innerHTML = `
                <img src="${imageUrl}" alt="${game.name}" onerror="this.src='https://placehold.co/140x140/1e293b/06b6d4?text=GAME';">
                <div class="recently-played-overlay">
                    <i class="fas fa-play recently-played-play-icon"></i>
                </div>
                <div class="recently-played-title">${game.name}</div>
            `;
            
            track.appendChild(item);
        });
        
        updateRecentlyPlayedScrollButtons();
        
        setupRecentlyPlayedScrollHandlers();
    } catch (err) {
        console.warn('Error loading recently played games:', err);
    }
}

function clearRecentlyPlayed() {
    if (confirm('Are you sure you want to clear your recently played games?')) {
        try {
            localStorage.removeItem(RECENTLY_PLAYED_KEY);
            loadRecentlyPlayed(); 
        } catch (err) {
            console.warn('Error clearing recently played games:', err);
        }
    }
}

function updateRecentlyPlayedScrollButtons() {
    const track = document.getElementById('recently-played-track');
    const leftBtn = document.getElementById('recently-played-scroll-left');
    const rightBtn = document.getElementById('recently-played-scroll-right');
    
    if (!track || !leftBtn || !rightBtn) return;
    
    const showScrollButtons = track.scrollWidth > track.clientWidth;
    
    if (showScrollButtons) {
        leftBtn.classList.remove('hidden');
        rightBtn.classList.remove('hidden');
    } else {
        leftBtn.classList.add('hidden');
        rightBtn.classList.add('hidden');
    }
}

function setupRecentlyPlayedScrollHandlers() {
    const leftBtn = document.getElementById('recently-played-scroll-left');
    const rightBtn = document.getElementById('recently-played-scroll-right');
    const track = document.getElementById('recently-played-track');
    
    if (!leftBtn || !rightBtn || !track) return;
    
    leftBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        track.scrollBy({ left: -250, behavior: 'smooth' });
    };
    
    rightBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        track.scrollBy({ left: 250, behavior: 'smooth' });
    };
    
    track.addEventListener('scroll', updateRecentlyPlayedScrollButtons);
    
    updateRecentlyPlayedScrollButtons();
}

document.addEventListener('DOMContentLoaded', function() {
    setupRecentlyPlayedScrollHandlers();
    loadRecentlyPlayed();
    setupPopularGamesScrollHandlers();
    loadPopularGames();
});

const POPULAR_GAMES_KEY = 'delta_popular_games_cache';
const POPULAR_GAMES_CACHE_DURATION = 5 * 60 * 1000;
const MAX_POPULAR_GAMES = 10;
const GAME_STATS_PATH = 'game_stats';

function trackGamePlay(gameName) {

    if (!window.firebaseInitialized) {
        console.warn('Firebase not initialized yet for tracking');
        return;
    }
    
    try {
        const db = firebase.database();
        const gameRef = db.ref(`${GAME_STATS_PATH}/${gameName}`);
        
        gameRef.transaction(function(current) {
            return (current || 0) + 1;
        }).catch(err => console.warn('Error tracking game play:', err));
    } catch (err) {
        console.warn('Error in trackGamePlay:', err);
    }
}

function loadPopularGames() {
    if (!window.firebaseInitialized) {
        setTimeout(loadPopularGames, 800);
        return;
    }
    try {
        const db = firebase.database();
        db.ref(GAME_STATS_PATH).orderByValue().limitToLast(MAX_POPULAR_GAMES).once('value', snapshot => {
            const val = snapshot.val();
            if (!val) {
                displayPopularGames([]);
                return;
            }
            const sorted = Object.entries(val).filter(([, count]) => count >= 15).sort((a, b) => b[1] - a[1]);
            const popularGames = [];
            for (const [gameName] of sorted) {
                const gameInfo = GAMES.find(g => g.name === gameName);
                if (gameInfo) popularGames.push({ name: gameInfo.name, path: gameInfo.path, image: gameInfo.image });
            }
            displayPopularGames(popularGames);
        });
    } catch (err) {
        console.warn('Error in loadPopularGames:', err);
    }
}

function displayPopularGames(popularGames) {
    try {
        const section = document.getElementById('popular-games-section');
        const track = document.getElementById('popular-games-track');
        
        if (!section || !track) return;
        
        const popularGamesEnabled = localStorage.getItem('popularGamesEnabled') !== 'false';
                section.style.display = popularGamesEnabled ? 'block' : 'none';

                if (popularGames.length === 0) {
                    track.innerHTML = '<p class="text-gray-500 text-sm py-2">No popular games yet. Check back later!</p>';
                    return;
                }
        
        track.innerHTML = '';

        popularGames.forEach((game, index) => {
            const item = document.createElement('div');
            item.className = 'popular-games-item';
            item.onclick = () => openGame(game.path, game.name);
            
            const imageUrl = game.image.startsWith('http') 
                ? game.image 
                : `${CDN_BASE_URL}${game.image}`;
            
            item.innerHTML = `
                <img src="${imageUrl}" alt="${game.name}" onerror="this.src='https://placehold.co/140x140/2d1f3d/ff6464?text=GAME';">
                <div class="popular-games-overlay">
                    <div style="text-align: center;">
                        <i class="fas fa-play popular-games-play-icon"></i>
                    </div>
                </div>
                <div class="popular-games-title">${game.name}</div>
            `;
            
            track.appendChild(item);
        });
        
        updatePopularGamesScrollButtons();
        setupPopularGamesScrollHandlers();
    } catch (err) {
        console.warn('Error displaying popular games:', err);
    }
}

function updatePopularGamesScrollButtons() {
    const track = document.getElementById('popular-games-track');
    const leftBtn = document.getElementById('popular-games-scroll-left');
    const rightBtn = document.getElementById('popular-games-scroll-right');
    
    if (!track || !leftBtn || !rightBtn) return;
    
    const showScrollButtons = track.scrollWidth > track.clientWidth;
    
    if (showScrollButtons) {
        leftBtn.classList.remove('hidden');
        rightBtn.classList.remove('hidden');
    } else {
        leftBtn.classList.add('hidden');
        rightBtn.classList.add('hidden');
    }
}

function setupPopularGamesScrollHandlers() {
    const leftBtn = document.getElementById('popular-games-scroll-left');
    const rightBtn = document.getElementById('popular-games-scroll-right');
    const track = document.getElementById('popular-games-track');
    
    if (!leftBtn || !rightBtn || !track) return;
    
    leftBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        track.scrollBy({ left: -250, behavior: 'smooth' });
    };
    
    rightBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        track.scrollBy({ left: 250, behavior: 'smooth' });
    };
    
    track.addEventListener('scroll', updatePopularGamesScrollButtons);
    
    updatePopularGamesScrollButtons();
}

