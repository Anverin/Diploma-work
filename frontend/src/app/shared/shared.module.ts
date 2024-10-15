import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticleCardComponent } from './components/article-card/article-card.component';
import {RouterModule} from "@angular/router";
import {MatDialogModule} from "@angular/material/dialog";
import {ReactiveFormsModule} from "@angular/forms";
import { LoaderComponent } from './components/loader/loader.component';


@NgModule({
  declarations: [
    ArticleCardComponent,
    LoaderComponent
  ],
  exports: [
    ArticleCardComponent,
    LoaderComponent
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    RouterModule
  ]
})
export class SharedModule { }
