# TODO: new API:
#
#                  zp(df) %>%
#                    zp_coord(pc1, pc2, pc3) %>%
#                    zp_coord(mds1, mds2, mds3) %>%
#                    zp_color(group) %>%
#                    zp_color(expr)
# 


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
#' @export
#' @examples
#' data(patients)
#' data(MGH30genes)
#'
#' zp(patients) %>%
#'   zp_coord(pc1, pc2, pc3) %>%
#'   zp_coord(mds1, mds2, mds3) %>%
#'   zp_color(patient) %>%
#'   zp_color(avg_log_exp)
#'
#' zp(MGH30genes) %>%
#'   zp_coord(tsne1, tsne2, tsne3) %>%
#'   zp_color(pathway)
zp <-
  function(data_) {
    msg <- list()
    msg$data <- data_
    msg$coord <- list()
    msg$color <- list()
    
    zp <- list()
    zp$msg <- msg
    class(zp) <- 'zp'
    zp
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
zp_color <- function(zp, color) {
  zp$msg$color[[length(zp$msg$color) + 1]] <- list( color = as.character(substitute(color)) )
  zp
}

#' @export
zp_coord <- function(zp, x, y, z) {
  zp$msg$coord[[length(zp$msg$coord) + 1]] <-
    list( x = as.character(substitute(x)),
          y = as.character(substitute(y)),
          z = as.character(substitute(z)) )
  zp
}

#' @import htmlwidgets
#' @export
print.zp <-
  function(zp, use_viewer=T) {
    sizing_policy <- sizingPolicy(padding=0, browser.fill=T, viewer.suppress=!use_viewer)
    createWidget('zp', zp$msg, sizingPolicy=sizing_policy)
  }
