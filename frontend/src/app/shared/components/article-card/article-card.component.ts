import {Component, Input} from '@angular/core';
import {ArticleCardType} from "../../../../types/article.type";
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'article-card',
  templateUrl: './article-card.component.html',
  styleUrls: ['./article-card.component.scss']
})
export class ArticleCardComponent {

  @Input() article!: ArticleCardType;

  serverStaticPath = environment.serverStaticPath;

  constructor() { }

}
