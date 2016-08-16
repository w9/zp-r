#' Aesthetic object for ZP
#'
#' @import pryr
#' @export
zpa <- function(...) {
  output <- lapply(named_dots(...), as.character)
  class(output) <- 'zpa'
  output
}

#' ZP
#'
#' @import htmlwidgets
#' @export
#' @examples
#' library(magrittr)
#'
#' data(patients)
#' data(MGH30genes)
#'
#' zp(patients) %>%
#'   zp_coord(pc1, pc2, pc3) %>%
#'   zp_coord(mds1, mds2, mds3) %>%
#'   zp_color(patient) %>%
#'   zp_color(avg_log_exp)
#'
#' zp(MGH30_genes) %>%
#'   zp_coord(tsne1, tsne2, tsne3) %>%
#'   zp_color(pathway)
zp <-
  function(data           = NULL,
           color          = list(),
           coord          = list(),
           title          = NULL,
           use_viewer     = F,
           ...
           ) {
    if (is.null(title) && !is.null(data)) title <- deparse(substitute(data))

    x <- list()
    x$data <- data
    x$mappings <- list()
    x$mappings$coord <- coord
    x$mappings$color <- color
    x$options <- list(
      debug          = F,
      animation      = T,
      dimmed_opacity = 0.1
      ) %>% overwrite_list(list(...))
    
    sizing_policy <- sizingPolicy(padding=0, browser.fill=T, viewer.suppress=!use_viewer)
    createWidget('zp', x, sizingPolicy=sizing_policy)
  }

# zp$msg $ data $ col1 = [ ... ]
#               $ col2 = [ ... ]
#               $ col3 = [ ... ]
#               $ col4 = [ ... ]
#               $ col5 = [ ... ]
#               $ col6 = [ ... ]
#               $ col7 = [ ... ]
#               $ col8 = [ ... ]
#
#        $ mapping $ coord $ coord1 = ['col1', 'col2', 'col3']
#                          $ coord2 = ['col4', 'col5', 'col6']
#
#                  $ color $ color1 = 'col7'
#                          $ color2 = 'col8'

#' @import dplyr
#' @export
zp_bind <- function(zp, data) {
  zp$x$data <- zp$x$data %>% bind_cols(data)
  zp
}


#' @export
zp_title <- function(zp, title) {
  zp$x$options$title <- title
  zp
}

#' @import dplyr
#' @import purrr
#' @export
zp_apply <- function(zp, f) {
  zp$x$data <- as_function(f)(zp$x$data)
  zp
}

#' @import dplyr
#' @export
zp_join <- function(zp, data) {
  zp$x$data <- zp$x$data %>% left_join(data)
  zp
}

#' @import dplyr
#' @export
zp_data <- function(zp, data) {
  zp$x$data <- data
  zp
}

#' @import zx
#' @import dplyr
#' @import magrittr
#' @export
zp_color <- function(zp, color=NULL) {
  color <- substitute(color)
  if (is.null(color)) {
    zp$x$mappings$color %<>% affix(NA)
  } else {
    color_col <- deparse(color)
    zp$x$data %<>% mutate_(color_col)
    zp$x$mappings$color %<>% affix(color_col)
  }
  zp
}

#' @import zx
#' @import dplyr
#' @import magrittr
#' @export
zp_colors_ <- function(zp, colors=NULL) {
  for (color in colors) {
    if (is.null(color)) {
      zp$x$mappings$color %<>% affix(NA)
    } else {
      zp$x$data %<>% mutate_(color)
      zp$x$mappings$color %<>% affix(color)
    }
  }
  zp
}

#' @import zx
#' @import dplyr
#' @import magrittr
#' @export
zp_coord <- function(zp, x, y, z) {
  x_col <- deparse(substitute(x))
  y_col <- deparse(substitute(y))
  z_col <- deparse(substitute(z))
  zp$x$data %<>% mutate_(x_col)
  zp$x$data %<>% mutate_(y_col)
  zp$x$data %<>% mutate_(z_col)
  zp$x$mappings$coord %<>% affix(
    list( x = x_col,
          y = y_col,
          z = z_col ))
  zp
}

#' @import zx
#' @import dplyr
#' @import pryr
#' @export
zp_options <- function(zp, ...) {
  new_options <- list(...)
  zp$x$options <- zp$x$options %>% overwrite_list(new_options)
  zp
}
