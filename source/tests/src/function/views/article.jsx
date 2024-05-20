import Content from './partials/content.jsx';

const Article = ({ title, content, subtitle, author }) => {
    const headContents = `
        <meta charset="UTF-8"/>
        <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>${title}</title>
    `;

    return (
        <html lang="en">
        <head dangerouslySetInnerHTML={{ __html: headContents }} />
        <body>
        <h1>{title}</h1>
        <Content {...{ subtitle, content, author }} />
        </body>
        </html>
    );
};

export default Article;