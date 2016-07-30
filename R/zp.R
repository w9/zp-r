# #' 3D scatter plot on Rstudio viewer
# #'
# #' @export
# #' @examples
# #' library(ggplot2)
# #' data(ret)
# #' qplot3(aes(x=x, y=y, z=z, color=group), data=ret)
# qplot3 <- function(mapping, data, verbose_level=0) {
#   # TODO: mapping sanity check
# 
#   folder_name <- 'js16'
#   temp_dir <- tempdir()
#   if (verbose_level > 1) message(sprintf('Creating directory %s', temp_dir))
# 
#   if (!file.exists(file.path(temp_dir, folder_name))) {
#     plotter_dir <- system.file('zp', package='zp')
#     file.copy(plotter_dir, temp_dir, recursive=T)
#     file.rename(file.path(temp_dir, 'zp'), file.path(temp_dir, folder_name))
#     if (verbose_level > 1) message(sprintf('Copy %s to %s', plotter_dir, temp_dir))
#   }
# 
#   json_string <- jsonlite::toJSON(list(data=data, mapping=lapply(mapping, as.character)),
#                                   dataframe='columns', auto_unbox=T)
# 
#   write(json_string, file.path(temp_dir, folder_name, 'query.json'));
# 
#   rstudioapi::viewer(paste0(file.path(temp_dir, folder_name, 'index.html')))
# }

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
#' data(patients)
#' data(MGH30genes)
#'
#' zp(patients, list(PCA=zpa(x=pc1, y=pc2, z=pc3, color=patient),
#'                   MDS=zpa(x=mds1, y=mds2, z=mds3, color=patient),
#'                   MDS_expr=zpa(x=mds1, y=mds2, z=mds3, color=highly_expressed),
#'                   PCA_expr=zpa(x=pc1, y=pc2, z=pc3, color=highly_expressed)))
#'
#' zp(MGH30genes, list(Correlation_tSNE=zpa(x=tsne1, y=tsne2, z=tsne3, color=pathway)))
zp <-
  function(data_, mappings_, use_viewer_=F) {
    msg <- list()
    msg$data <- data_
    
    if (class(mappings_) == 'zpa') {
      msg$mappings <- list('unnamed_mapping'=mappings_)
    } else if (class(mappings_) == 'list') {
      if (is.na(names(mappings_))) {
        stop('Error: no names found in mappings_.')
      } else {
        msg$mappings <- mappings_
      }
    } else {
      stop(sprintf('Error: mappings_ has unrecognized class %s.', class(mappings_)))
    }

    sizing_policy <- sizingPolicy(padding=0, browser.fill=T, viewer.suppress=!use_viewer_)

    createWidget('zp', msg, sizingPolicy=sizing_policy)
  }
