import { _ } from "core-js";

export default class PdfDocDefinition {

    static createDefinition(ideas) {
        const images = {};
        const publishedIdeas = ideas.filter((idea) => idea.publishedDate);
        
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
                    text: currentPage.toString() + ' of ' + pageCount, 
                    alignment: 'right', 
                    margin: [0, 0, 32, 0] 
                }
            },
            images
        };

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
                {
                    text: `Thema: ${idea['extraData.theme']}`,
                    margin: [0,0,0,4]
                },
                {
                    text: `Gebied: ${idea['extraData.area']}`,
                    margin: [0,0,0,4]
                },
                {
                    text: `Telefoonnummer: ${idea['extraData.phone']}`,
                    margin: [0,0,0,4]
                },
                {
                    text: `Email: ${idea['user.email']}`
                },
                index < ideas.length -1 ? {
                    text: '',
                    pageBreak: 'after'
                }: null,
            );
        });
        return result;
    }
};