import fs from 'fs';

import ejs from 'ejs';
import pug from 'pug';
import hbs from 'express-hbs';
import showdown from 'showdown';
import jsx from '@itznotabug/appexpress-jsx';

const showdownConverter = () => {
    const converter = new showdown.Converter();
    converter.setOption('noHeaderId', true);
    return converter;
};

export default (express) => {
    express.engine('ejs', ejs);
    express.engine('pug', pug);

    // we can club this to an array
    // once appexpress is released!
    express.engine('js', jsx.engine);
    express.engine('jsx', jsx.engine);
    express.engine('tsx', jsx.engine);

    express.engine('hbs', hbs.express4());

    // a custom engine with showdown to render Markdown.
    express.engine('md', (filePath, options, callback) => {
        fs.readFile(filePath, (error, content) => {
            if (error) return callback(error);
            let rendered = content
                .toString()
                .replace(/%([^%]+)%/g, (match, key) => {
                    return (
                        key
                            .split('.')
                            .reduce((acc, k) => acc && acc[k], options) || match
                    );
                });

            rendered = showdownConverter().makeHtml(rendered);

            return callback(null, rendered);
        });
    });
};
