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
  function(data_, use_viewer=T) {
    x <- list()
    x$data <- data_
    x$mappings <- list()
    x$mappings$coord <- list()
    x$mappings$color <- list()
    
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

#' @export
zp_color <- function(zp, color=NULL) {
  if (is.null(color)) {
    zp$x$mappings$color[[length(zp$x$mappings$color) + 1]] <- NA
  } else {
    zp$x$mappings$color[[length(zp$x$mappings$color) + 1]] <- as.character(substitute(color))
  }
  zp
}

#' @export
zp_coord <- function(zp, x, y, z) {
  zp$x$mappings$coord[[length(zp$x$mappings$coord) + 1]] <-
    list( x = as.character(substitute(x)),
          y = as.character(substitute(y)),
          z = as.character(substitute(z)) )
  zp
}
