import fs from 'fs';
import path from 'path';
import https from 'https';

const BASE_URL = 'https://poke.idleworld.online/assets/';
const OUTPUT_DIR = path.resolve('src/renderer/assets');

// Mapeamento estruturado com os arquivos reais que você mapeou nas pastas do jogo
const assetStructure = {
    'items': [
        'band_aid.png',
        'bitten_apple.png',
        'darkness_stone.gif',
        'earth_ball.png',
        'earth_stone.gif',
        'electric_box.png',
        'enchanted_gem.png',
        'enigma_stone.gif',
        'essence_of_fire.png',
        'feather.png',
        'fire_stone.gif',
        'fur.png',
        'future_orb.png',
        'heart_stone.gif',
        'ice_bra.png',
        'ice_orb.png',
        'ice_stone.gif',
        'lizard_tail.png',
        'martial_arts_scroll.png',
        'pot_of_lava.png',
        'punch_machine.png',
        'rat_tail.png',
        'rock_stone.gif',
        'rubber_ball.png',
        'sandbag.png',
        'screw.png',
        'sheep_wool.png',
        'ski_poles.png',
        'small_stone.png',
        'snow_skis.png',
        'snowball.png',
        'spin_machine.png',
        'stone_orb.png',
        'straw.png',
        'thunder_stone.gif',
        'tusk.png'
    ],
    'stones': [
        'ancient_stone.gif'
    ],
    'types': [
        'bug.png',
        'dark.png',
        'dragon.png',
        'electric.png',
        'fairy.png',
        'fighting.png',
        'fire.png',
        'flying.png',
        'ghost.png',
        'grass.png',
        'ground.png',
        'ice.png',
        'normal.png',
        'poison.png',
        'psychic.png',
        'rock.png',
        'steel.png',
        'water.png'
    ]
};

async function downloadFile(folder, filename) {
    const fileUrl = `${BASE_URL}${folder}/${filename}`;
    const targetFolder = path.join(OUTPUT_DIR, folder);
    const targetPath = path.join(targetFolder, filename);

    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
    }

    return new Promise((resolve) => {
        https.get(fileUrl, (response) => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(targetPath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log(`[Baixado com Sucesso] ${folder}/${filename}`);
                    resolve(true);
                });
            } else {
                console.warn(`[Erro ${response.statusCode}] Não encontrado: ${folder}/${filename}`);
                resolve(false);
            }
        }).on('error', (err) => {
            console.error(`[Erro de Rede] ${folder}/${filename}:`, err.message);
            resolve(false);
        });
    });
}

async function run() {
    console.log('🚀 Iniciando o download estruturado dos assets via Node.js...');

    for (const [folder, files] of Object.entries(assetStructure)) {
        for (const file of files) {
            await downloadFile(folder, file);
            await new Promise(r => setTimeout(r, 100)); // Pequeno delay preventivo
        }
    }
    console.log('✨ Processo finalizado! Pastas organizadas em src/renderer/assets/');
}

run();