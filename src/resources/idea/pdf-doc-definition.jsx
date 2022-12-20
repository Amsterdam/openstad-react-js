export default class PdfDocDefinition {

    static async createDefinition(ideas) {
        const images = {};
        const publishedIdeas = ideas.filter((idea) => idea.publishDate);

        publishedIdeas.forEach(idea => {
            try {
                if(idea['extraData.images'] && idea['extraData.images'] !== '[]') {
                    images['image'+ idea.id] = JSON.parse(idea['extraData.images'])[0];
                }
            } catch(e) {

            }
        });
        
        
        let result = {
            pageSize: 'A4',
            content: [],
            footer: function(currentPage, pageCount) { 
                return { 
                    text: `${currentPage.toString()} van ${pageCount}`, 
                    alignment: 'right', 
                    margin: [0, 0, 32, 0] 
                }
            },
            images
        };

        await this._setResolvedLocation(publishedIdeas);
        
        publishedIdeas.forEach((idea, index) => {
            result.content.push(
                {
                    text: idea.title,
                    fontSize: 24,
                    bold: true,
                    margin: [0,0,0,16]
                },
                images['image'+idea.id]? {
                    image: 'image'+idea.id,
                    width: ((595.28) - 80),
                    margin: [0,0,0,16],
                }: null,
                {
                    text: `Door: ${idea['user.displayName']}`
                },
                {
                    text: `${idea.startDateHumanized}`,
                    margin: [0,0,0,16]
                },
                {
                    text: idea.summary,
                    bold: true,
                    margin: [0,0,0,4]
                },
                {
                    text: idea.description
                    .replace(/<br \/>/ig, "")
                    .replace(/<\/div>/ig, "")
                    .replace(/<div>/ig, ""),
                    margin: [0,0,0,32],
                },
                idea['extraData.theme']? {
                    text: `Thema: ${idea['extraData.theme']}`,
                    margin: [0,0,0,4]
                }:null,
                idea['extraData.area']? {
                    text: `Gebied: ${idea['extraData.area']}`,
                    margin: [0,0,0,4]
                }:null,
                idea['extraData.phone']? {
                    text: `Telefoonnummer: ${idea['extraData.phone']}`,
                    margin: [0,0,0,4]
                }:null,
                idea['user.email']? {
                    text: `Email: ${idea['user.email']}`,
                    margin: [0,0,0,16]
                }:null,
                idea.resolvedLocation? {
                    text: `Locatie: ${idea.resolvedLocation.quarter ?? 'Straat onbekend'}  ${idea.resolvedLocation.postcode ?? 'Postcode onbekend'} ${idea.resolvedLocation.city ?? 'Stad onbekend'}`,
                    margin: [0,0,0,4]
                }:null,
                idea.tags? {
                    text: `Tags: ${idea.tags}`,
                    margin: [0,0,0,4]
                }:null,
            );

            Object.keys(idea).filter(key => key.startsWith("extraData") && key !== "extraData.phone" && key !== "extraData.theme" && key !== "extraData.area")
            .forEach(key => {
                result.content.push(idea[key]? {text: `${key}: ${idea[key]}`, margin: [0,0,0,4]}: null)
            });

            result.content.push( index < ideas.length -1 ? {
                text: '',
                pageBreak: 'after'
            }: null);
        });
        return result;
    }


    static async _setResolvedLocation(ideas) {
        for (const idea of ideas) {
            let location = null;

            if(idea.location) {
                try {
                    location = JSON.parse(idea.location);
                } catch(error) {
                    console.error(`Could not translate location: ${error}`);
                }    

                if(location) {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=geojson&addressdetails=1&accept-language=nl&countrycodes=nl&lat=${location.coordinates[0]}&lon=${location.coordinates[1]}`);
                    const resolvedLocation = await response.json();
                    idea.resolvedLocation = {...resolvedLocation?.features?.[0]?.properties?.address};
                }
            }
        }
    }
};