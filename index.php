<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Search Horizon Alpha</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="multiple platform search tool plugin backup social network application">
  <meta name="author" content="Leon Lin">

	<!--link rel="stylesheet/less" href="less/bootstrap.less" type="text/css" /-->
	<!--link rel="stylesheet/less" href="less/responsive.less" type="text/css" /-->
	<!--script src="js/less-1.3.3.min.js"></script-->
	<!--append ‘#!watch’ to the browser URL, then refresh the page. -->
	
	<link href="css/bootstrap.min.css" rel="stylesheet">
	<link href="css/style.css" rel="stylesheet">

  <!-- HTML5 shim, for IE6-8 support of HTML5 elements -->
  <!--[if lt IE 9]>
    <script src="js/html5shiv.js"></script>
  <![endif]-->

  <!-- Fav and touch icons -->
  <link rel="apple-touch-icon-precomposed" sizes="144x144" href="img/apple-touch-icon-144-precomposed.png">
  <link rel="apple-touch-icon-precomposed" sizes="114x114" href="img/apple-touch-icon-114-precomposed.png">
  <link rel="apple-touch-icon-precomposed" sizes="72x72" href="img/apple-touch-icon-72-precomposed.png">
  <link rel="apple-touch-icon-precomposed" href="img/apple-touch-icon-57-precomposed.png">
  <link rel="shortcut icon" href="img/favicon.png">
  
	<script type="text/javascript" src="js/jquery.min.js"></script>
	<script type="text/javascript" src="js/bootstrap.min.js"></script>
	<script type="text/javascript" src="js/scripts.js"></script>
	
	<style>
		footer {
			margin-top:10%;
		}
	</style>
</head>

<body>
<div class="container">
	<div class="row clearfix">
		<div class="col-md-2 column">
		</div>
		<div class="col-md-8 column">
			<div class="page-header">
				<h1>
					Search Horizon Alpha <small>Multi-Social search tool</small>
				</h1>
			</div>
		</div>
		<div class="col-md-2 column">
		</div>
	</div>
	<div class="row clearfix">
		<div class="col-md-12 column">
		</div>
	</div>
	<div class="row clearfix">
		<div class="col-md-2 column">
			<img alt="140x140" src="./fb/fb2.png" class="img-thumbnail">
		</div>
		<div class="col-md-2 column">
			<img alt="140x140" src="./gplus/gplus1.png" class="img-thumbnail">
		</div>
		<div class="col-md-2 column">
			<img alt="140x140" src="./twi/twi.png" class="img-thumbnail">
		</div>
		<div class="col-md-2 column">
			<img alt="140x140" src="http://lorempixel.com/140/140/" class="img-thumbnail">
		</div>
		<div class="col-md-2 column">
			<img alt="140x140" src="http://lorempixel.com/140/140/" class="img-thumbnail">
		</div>
		<div class="col-md-2 column">
			<img alt="140x140" src="http://lorempixel.com/140/140/" class="img-thumbnail">
		</div>
	</div>
	<div class="row clearfix">
		<div class="col-md-12 column">
			<h2>
				2013/12/7
			</h2>
			<p>
				Add search query & site<br>
				use php plugin "curl" to fetch data on other websites<br>
				use php DOM document to transform data to information<br>
			</p>
			<p>
				<a class="btn" href="#">View details »</a>
			</p>
		</div>
	</div>
	<div class="row clearfix">
		<div class="col-md-12 column">
			<h2>
				Heading
			</h2>
			<p>
				Donec id elit non mi porta gravida at eget metus. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Etiam porta sem malesuada magna mollis euismod. Donec sed odio dui.
			</p>
			<p>
				<a class="btn" href="#">View details »</a>
			</p>
		</div>
	</div>
	<div class="row clearfix">
		<div class="col-md-12 column">
		</div>
	</div>
	<div class="row clearfix">
		<div class="col-md-12 column">
		</div>
	</div>
	<div class="row clearfix">
		<div class="col-md-12 column">
		</div>
	</div>
	<div class="row clearfix">
		<div class="col-md-12 column">
		</div>
	</div>
	<div class="row clearfix">
		<div class="col-md-12 column">
			<div class="tabbable" id="tabs-663924">
				<ul class="nav nav-tabs">
					<li class="active">
						<a href="#panel-199176" data-toggle="tab">Plurk</a>
					</li>
					<li>
						<a href="#panel-627330" data-toggle="tab">Twitter</a>
					</li>
				</ul>
				<div class="tab-content">
					<div class="tab-pane active" id="panel-199176">
						<p>
							<?php
						        if(isset($_GET["keyword"]))
						        {
						                $key=$_GET["keyword"];
						                $key=str_replace(" ","+",$key);
						        }
						        else
						                ;
						        if(isset($_GET["site"]))
						        {
						                $site="site:".$_GET["site"];
						        }
						        else
						                ;
						        $ch = curl_init();
						        $options = array(CURLOPT_URL =>
						        'www.google.com/search?q='.$key."+".$site,
						        CURLOPT_HEADER => false,
						        CURLOPT_RETURNTRANSFER => true,
						        CURLOPT_USERAGENT => "Google Bot",
						        CURLOPT_FOLLOWLOCATION => true
						        );
						        curl_setopt_array($ch, $options);
						        $output = curl_exec($ch);
						        curl_close($ch);

						        $doc= new DOMDocument();
						        $doc->loadHTML($output);
						        
						        $list=$doc->getElementById("ires")->getElementsByTagName("a");

						        $links=$doc->getElementsByTagName("cite");
						        $index=0;
						        foreach( $list as $node)
						        {
						        	if($node->textContent === "Cached")
						        	{
						        		break;
						        	}
						        	else
						        	{
							        	$link=$links->item($index);
							        	echo "<li>".$node->textContent."</li>";
							        	$node->setAttribute("href","http://".$link->textContent);
							        	$index++;
						        	}
						        }
						        echo $doc->saveHTML($doc->getElementById("ires"));
						        //echo $output;
							?>
						</p>
					</div>
					<div class="tab-pane" id="panel-627330">
						<p>
							Howdy, I'm in Section 2.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
<footer>
</footer>
</body>
</html>
