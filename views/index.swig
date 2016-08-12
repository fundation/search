<div id="search" style="max-width:300px;margin:auto;">

    <h1>Search Results Example</h1>
    <h3 style="color:red;">Not to be used in production</h3>
    <br/>

    {% if articles.length > 0 %}
	    <section>

    	{% for article in articles %}
            <article class="article">
                <a href="{{ article.path }}">
                    <img src="{{ article.image }}" alt="{{ article.image_caption }}" style="max-width:300px;"/>
                </a>
                <div>
                    <div>Tag: {{ article.tags[0] }}</div>
                    <div>Title: <a href="{{ article.path }}">{% autoescape false %}{{ article.title }}{% endautoescape %}</a></div>
                    <div>Author: {% autoescape false %}{{ article.display_author }}{% endautoescape %}</div>
                </div>
            </article>
    	{% endfor %}

    	</section>
    {% else %}
        <h2>No Articles Found!</h2>
    {% endif %}

</div>
