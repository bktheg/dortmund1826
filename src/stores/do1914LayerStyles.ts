export function getDo1914LayerDefinitions(): any[] {
    return [
        {
            id: 'hausnummern-text',
            'source-layer': 'hausnummernf',
            minzoom: 17,
            type: 'symbol',
            layout: {
                'text-field': ['get', 'hnr'],
                'text-size': ['interpolate', ['linear'], ['zoom'], 17, 8, 22, 20],
                'text-rotate': ['get', 'rotlabel'],
                'text-allow-overlap': true,
                'text-pitch-alignment': 'viewport',
            },
            paint: {
                'text-halo-width': 0.8,
                'text-halo-color': '#ffffff',
            },
        },
        {
            id: 'strassen-text',
            'source-layer': 'strassenf',
            minzoom: 16,
            type: 'symbol',
            layout: {
                'text-field': ['get', 'name'],
                'text-size': ['interpolate', ['linear'], ['zoom'], 16, 16, 22, 46],
                'symbol-placement': 'line',
                'text-allow-overlap': true,
                'text-pitch-alignment': 'viewport',
            },
            paint: {
                'text-halo-width': 1,
                'text-halo-color': '#ffffff',
            },
        },
        {
            id: 'gebaeude-name-text',
            'source-layer': 'gebaeudef',
            type: 'symbol',
            minzoom: 15,
            filter: ['all', ['!=', ['get', 'name'], null], ['!=', ['get', 'name'], '']],
            layout: {
                'text-field': ['get', 'name'],
                'text-size': ['interpolate', ['linear'], ['zoom'], 15, 9, 22, 36],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Regular'],
            },
            paint: {
                'text-color': '#5d5d5d',
                'text-halo-color': 'hsl(0, 0%, 100%)',
                'text-halo-width': 0.4,
            },
        },
        {
            id: 'gebaeude-line',
            'source-layer': 'gebaeudef',
            type: 'line',
            paint: {
                'line-color': '#525252',
                'line-width': ['interpolate', ['linear'], ['zoom'], 13, 0.02, 17, 0.8, 22, 8],
            },
        },
        {
            id: 'gebaeude',
            'source-layer': 'gebaeudef',
            type: 'fill',
            filter: ['any', ['==', ['get', 'name'], null], ['==', ['get', 'name'], '']],
            paint: {
                'fill-color': '#de585a',
                'fill-opacity': 0.59,
            },
        },
        {
            id: 'gebaeude-name',
            'source-layer': 'gebaeudef',
            type: 'fill',
            filter: ['all', ['!=', ['get', 'name'], null], ['!=', ['get', 'name'], '']],
            paint: {
                'fill-color': '#bc151b',
                'fill-opacity': 0.76,
                'fill-outline-color': '#525252',
            },
        },
        {
            id: 'flaechen-line',
            'source-layer': 'flaechenf',
            filter: ['any', ['==', ['get', 'typ'], 0], ['==', ['get', 'typ'], null]],
            type: 'line',
            paint: {
                'line-color': '#797979',
                'line-width': ['interpolate', ['linear'], ['zoom'], 13, 0.01, 17, 0.6, 22, 6],
            },
        },
        {
            id: 'flaechen',
            'source-layer': 'flaechenf',
            type: 'fill',
            filter: ['any', ['==', ['get', 'typ'], 0], ['==', ['get', 'typ'], null]],
            paint: {
                'fill-color': '#a4a4a4',
                'fill-opacity': 0.27,
            },
        },
        {
            id: 'flaechen-gruenflaechen',
            'source-layer': 'flaechenf',
            type: 'fill',
            filter: ['==', ['get', 'typ'], 1],
            paint: {
                'fill-color': '#52a757',
                'fill-opacity': 0.49,
            },
        },
        {
            id: 'flaechen-trottoir',
            'source-layer': 'flaechenf',
            type: 'fill',
            filter: ['==', ['get', 'typ'], 2],
            paint: {
                'fill-color': '#b1b1c0',
                'fill-opacity': 0.39,
            },
        },
        {
            id: 'flaechen-trottoir-linien',
            'source-layer': 'flaechenf',
            type: 'line',
            filter: ['==', ['get', 'typ'], 2],
            paint: {
                'line-color': '#797979',
                'line-width': ['interpolate', ['linear'], ['zoom'], 13, 0.01, 17, 0.6, 22, 6],
                'line-dasharray': [6, 3],
            },
        },
        {
            id: 'flaechen-wasser',
            'source-layer': 'flaechenf',
            type: 'fill',
            filter: ['==', ['get', 'typ'], 3],
            paint: {
                'fill-color': '#334fc0',
                'fill-opacity': 0.46,
            },
        },
    ]
}
