import {Component, OnInit} from '@angular/core';
import {ArticleService} from "../../../shared/services/article.service";
import {ArticleCardType} from "../../../../types/article.type";
import {CategoryType} from "../../../../types/category.type";
import {CategoryService} from "../../../shared/services/category.service";
import {ActiveParamsType} from "../../../../types/active-params.type";
import {ActivatedRoute, Router} from "@angular/router";
import {ActiveParamsUtil} from "../../../shared/utils/active-params.util";
import {AppliedFilterType} from "../../../../types/applied-filter.type";
import {debounceTime} from "rxjs";

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit {

  //переменные для хранения результатов запросов
  articles: ArticleCardType[] = [];
  categories: CategoryType[] = [];

  //значение открытости списка фильтров
  filterOpen: boolean = false;

  //хранение категорий в url (выбранных)
  activeParams: ActiveParamsType = {categories: []};

  //хранение выбранных фильтров для отображения их в виде плашек
  appliedFilters: AppliedFilterType[] = [];

  pages: number[] = [];

  constructor(private articleService: ArticleService,
              private categoryService: CategoryService,
              private router: Router,
              private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.categoryService.getCategories()
      .subscribe(data => {
        this.categories = data;

        //подписаться на изменение query-параметров, чтобы на основании них сразу отображать нужные фильтры, в т.ч. при перезагрузке
        this.activatedRoute.queryParams
          .pipe(
            debounceTime(500)
          )
          .subscribe(params => {
            this.activeParams = ActiveParamsUtil.processParams(params);

            //обнулить и снова добавить выбранные фильтры
            this.appliedFilters = [];

            this.activeParams.categories?.forEach(url => {
              const foundCategory = this.categories.find(category => category.url === url);
              if (foundCategory) {
                this.appliedFilters.push({
                  name: foundCategory.name,
                  urlParam: foundCategory.url
                });

                //поменять свойство isActive категории в списке фильтров (true, если категория найдена среди активных)
                foundCategory.isActive = true;
              }
            });

            //получить статьи согласно query-параметрам
            this.articleService.getArticles(this.activeParams)
              .subscribe(data => {
                this.pages = [];  // обнулить массив страниц, чтобы сделать пагинацию
                for (let i = 1; i <= data.pages; i++) {
                  this.pages.push(i);  //запушить в массив обнаруженное количество страниц
                }

                this.articles = data.items;   //установить полученные статьи в массив статей
              });
          });
      });
  }

  //просто переключатель для открывания/закрывания блока фильтров
  toggleFilters() {
    this.filterOpen = !this.filterOpen;
  }

  updateFilterParam(url: string) {  //вызывается по клику на название категории в фильтре
    //локальная переменная, true при обнаружении категории в массиве активных (массив - свойство переменной activeParams)
    let checked: boolean = this.activeParams.categories.includes(url);

    //переключатель:
    if (checked) {   //если категория активна (есть в url страницы) - сделать неактивной (удалить из url)
      this.activeParams.categories = this.activeParams.categories.filter(item => item !== url);
    } else {  //если ее там нет - добавить
      this.activeParams.categories = [...this.activeParams.categories, url];
    }

    this.activeParams.page = 1; //сбросить страницу на первую, чтобы перекинуть к началу
    this.router.navigate(['/blog'], {
      queryParams: this.activeParams  //(там {page: 1, categories: [url, url]};)
    });
  }

  removeAppliedFilter(appliedFilter: AppliedFilterType) {
    // перезаписать массив с выбранными категориями, оставив только те, у которых url не равен выбранному
    this.activeParams.categories = this.activeParams.categories?.filter(item => item !== appliedFilter.urlParam);

    this.activeParams.page = 1; //сбросить страницу на первую
    // "перевести на страницу" с новыми query-параметрами
    this.router.navigate(['/blog'], {
      // queryParams: {page: 1, categories: [url]};
      queryParams: this.activeParams
    });
  }

  openPage(page: number) {
    this.activeParams.page = page;

    this.router.navigate(['/blog'], {
      queryParams: this.activeParams
    });
  }

  openPrevPage() {
    if (this.activeParams.page && this.activeParams.page > 1) {
      this.activeParams.page--;
      this.router.navigate(['/blog'], {
        queryParams: this.activeParams
      });
    }
  }

  openNextPage() {
    if (this.activeParams.page && this.activeParams.page < this.pages.length) {
      this.activeParams.page++;
      this.router.navigate(['/blog'], {
        queryParams: this.activeParams
      });
    }
  }

}
