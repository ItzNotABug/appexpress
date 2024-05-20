const Content = ({ subtitle, content, author }) => {
    return (
        <article>
            <header>
                <h3>{subtitle}</h3>
            </header>
            <section>
                {content}
            </section>
            <footer>
                <p>Written by: {author}</p>
            </footer>
        </article>
    );
};

export default Content;