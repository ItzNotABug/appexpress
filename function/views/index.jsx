const IndexLandingPage = ({ title, slogan, developer, renderType }) => {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <title>{title}</title>
                <link rel="stylesheet" type="text/css" href="/styles.css" />
            </head>
            <body>
                <div className="container">
                    <div className="logo">{title}</div>
                    <div
                        className="slogan"
                        dangerouslySetInnerHTML={{ __html: slogan }}
                    />
                    <button
                        className="action-button"
                        onClick={() =>
                            window.open(
                                'https://github.com/itznotabug/appexpress',
                                '_blank',
                            )
                        }
                    >
                        Learn More
                    </button>
                </div>
                <footer>
                    Built by{' '}
                    <a
                        href={developer.url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {developer.handle}
                    </a>
                    <p>{renderType}</p>
                </footer>
            </body>
        </html>
    );
};

export default IndexLandingPage;
