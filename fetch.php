<?php
	/**/
    if(isset($_GET["keyword"]))
    {
            $key=$_GET["keyword"];
            $key=str_replace(" ","+",$key);
    }
    else
            $key="";
    if(isset($_GET["site"]))
    {
    	switch($_GET["site"])
    	{
    		case 1:
    			$site="site:www.plurk.com";
    			break;
    		case 2:
    			$site="site:twitter.com";
    			break;
    		case 3:
    			$site="site:www.facebook.com";
    			break;
    		case 4:
    			$site="site:plus.google.com";
    			break;
    	}
    }
    else
    	$site="site:www.facebook.com";
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
    libxml_use_internal_errors(TRUE);
    $doc->loadHTML($output);
    libxml_clear_errors();

    $list=$doc->getElementById("ires")->getElementsByTagName("a");

    $links=$doc->getElementsByTagName("cite");
    $index=0;
    foreach( $list as $node)
    {
    	if($node->textContent ==="Cached")
    	{
    		continue;
    	}
    	else if($node->textContent ==="Similar")
    	{
    		continue;
    	}
    	else
    	{
        	$link=$links->item($index);
        	//echo "<li>".$node->textContent."</li>"; //debug
        	if($link->textContent)
        	{
        		if($_GET["site"]!=1)
        			$node->setAttribute("href",$link->textContent);
        		else
        			$node->setAttribute("href","http://".$link->textContent);
        	}
        	else
        		;
        	$index++;
    	}
    }
    echo $doc->saveHTML($doc->getElementById("ires"));
    //echo $output;
    /**/
?>