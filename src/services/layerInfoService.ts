export interface LayerInfo {
    title: string
    paragraphs: string[]
}

const LAYER_INFO: Record<string, LayerInfo> = {
    uraufnahme: {
        title: 'Uraufnahme (1836-1850)',
        paragraphs: [
            'Die Preußische Kartenaufnahme wurde in den Jahren 1836-1850 für die Provinzen Rheinland und Westfalen im Maßstab 1:25.000 angefertigt. Die Karte wird von <a href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/topographische_karten/historisch/1836/index.html">Geobasis NRW</a> im Onlineverfahren ohne Einschränkungen oder Bedingungen bereitgestellt. Die Karte steht nicht in allen Zoomstufen zur Verfügung.',
        ],
    },
    neuaufnahme: {
        title: 'Neuaufnahme (1891-1912)',
        paragraphs: [
            'Die Preußische Kartenaufnahme wurde als Neuaufnahme in den Jahren 1891-1912 für das gesamten Landesgebiet Preußens im Maßstab 1:25.000 angefertigt. Die Karte wird von <a href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/topographische_karten/historisch/1891/index.html">Geobasis NRW</a> im Onlineverfahren ohne Einschränkungen oder Bedingungen bereitgestellt. Die Karte steht nicht in allen Zoomstufen zur Verfügung.',
        ],
    },
    'vector-do1914': {
        title: 'Dortmund Zentrum (1914)',
        paragraphs: [
            'Der Layer zeigt einen Ausschnitt des Dortmunder Stadtzentrums um das Jahr 1914 und stellt die damaligen Gebäude, Straßen, Parzellen und Hausnummern dar. Grundlage sind die Inselkarten im Stadtarchiv Dortmund (Best. 200/07-6), die überwiegend aus den Jahren 1907–1913 stammen. Nicht jedes Gebäude ist auf diesen Karten verzeichnet; insbesondere Hof- und Hintergebäude fehlen teilweise. Solche Lücken wurden, soweit möglich, unter Zuhilfenahme späterer Karten geschlossen. Jahre und Hausnummern wurden teils anhand der Gebäudesteuerrollen (Stadtarchiv Dortmund Best. 162/10) ermittelt. Wichtig ist hier anzumerken, dass es sich bei den Jahresangaben in den Gebäudesteuerrollen um ungefähre Baujahre handelt, da hier nur das Jahr erfasst ist, in dem das Gebäude erstmals zur Gebäudesteuer veranlagt wurde (bzw. alle weiteren steuerrelevanten Änderungen).',
            'Einzelne Gebäude lassen sich über die „Untersuchen"-Funktion auswählen, um weitergehende Informationen aus dem Dortmunder Adressbuch von 1914 anzuzeigen. Die Adressbuchdaten wurden überwiegend mittels Texterkennung digitalisiert; einzelne Schreibfehler sind daher möglich. Einträge aus dem Bereich Behörden wurden in der Regel nur erfasst, sofern sie einer konkreten Adresse zugeordnet werden konnten.',
        ],
    },
}

export function getLayerInfo(id: string): LayerInfo | undefined {
    return LAYER_INFO[id]
}

export function hasLayerInfo(id: string): boolean {
    return id in LAYER_INFO
}
